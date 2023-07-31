const Config = require('../config');

const mongoose = require('mongoose');
const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Collateral = require('../models/collateral');
const MarketPrice = require('../models/market_price');
const passport = require('passport');
const Util = require('../util');
const moment = require('moment');

// 담보 내역
router.get('/cltr_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const filter = {account_id: req.user._id};
		if (req.query.last_session_id) {
			filter._id = {
				'$lt': req.query.last_session_id
			};
		}
		if (req.query.whence) {
			if (req.query.whence.length !== 6) {
				res.status(400).json({
					error: {
						code: 'INVALID_WHENCE',
						message: 'Parameter whence must be YYYYMM format'
					}
				});
				return;
			}
			const year = req.query.whence.substring(0, 4);
			const month = req.query.whence.substring(4);
			const fromDate = moment([year, Number(month) - 1]);
			const toDate = moment(fromDate).add(1, 'month');
			filter.createdAt = {
				'$gte': fromDate,
				'$lt': toDate
			};
		}

		const collaterals = await Collateral.find(filter, {}, {
			sort: {createdAt: -1},
			limit: 20,
		}).lean();

		const cltr_hist = collaterals.map(collateral => ({
			session_id: collateral._id,
			date: new Date(collateral.createdAt).getTime(),
			collateral_name: collateral.collateral_name,
			ex_market: collateral.ex_market,
			collateral_amount: collateral.collateral_amount ? collateral.collateral_amount.toString() : undefined,
			collateral_rls_amount: collateral.collateral_amount && collateral.collateral_price ? (collateral.collateral_amount * collateral.collateral_price).toString() : undefined,
			approval_id: collateral.approval_id,
		}));

		const last_session_id = cltr_hist.length && cltr_hist[cltr_hist.length - 1].session_id;

		res.json({
			last_session_id,
			cltr_hist,
		})
	}
);

// 담보 제공
router.post('/cltr_init',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.ex_market) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter ex_market is required'
				}
			});
			return;
		}
		if (!req.body.collateral_name) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter collateral_name is required'
				}
			});
			return;
		}
		if (!req.body.collateral_amount) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter collateral_amount is required'
				}
			});
			return;
		}
		const collateralAmount = Number(req.body.collateral_amount);
		if (isNaN(collateralAmount)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter collateral_amount is not a number'
				}
			});
			return;
		}
		if (!req.body.offer_date) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter offer_date is required'
				}
			});
			return;
		}
		const offerDate = new Date(req.body.offer_date);

		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE).getTime();
		const code = await Util.generateDynamicCode();
		const collateralPrice = await MarketPrice.findOne({}, {}, { sort: { 'timestamp' : -1 } }).exec();

		const newCollateral = new Collateral({
			collateral_name: req.body.collateral_name,
			collateral_amount: collateralAmount,
			collateral_price: +collateralPrice.close,
			ex_market: req.body.ex_market,
			offer_date: offerDate,
			dynamic_code: code,
			expiry: expiry,
			status: 'INIT',
		});
		const created = await newCollateral.save();
		if (created) {
			res.json({
				session_id: created._id,
				dynamic_code: created.dynamic_code,
				expire: created.expiry.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'CREATE_COLLATERAL_ERROR',
				message: 'Error occured while creating collateral'
			});
		}
	}
);

// 담보 제공 리프레시
router.post('/cltr_init_refresh',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.session_id) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter session_id is required'
				}
			});
			return;
		}
		if (!mongoose.Types.ObjectId.isValid(req.body.session_id)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter session_id is invalid'
				}
			});
			return;
		}
		const collateral = await Collateral.findOne({_id: req.body.session_id}).exec();
		if (!collateral) {
			res.status(400).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Collateral id not found ${req.body.session_id}`
				}
			});
			return;
		}
		if (collateral.status !== 'INIT') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Collateral status is ${collateral.status}`
				}
			});
			return;
		}
		if (collateral.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Payment expired'
				}
			});
			return;
		}
		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE);
		collateral.expiry = expiry;
		collateral.createdAt = new Date(timestamp);

		const code = await Util.generateDynamicCode();
		collateral.dynamic_code = code;

		const updated = await collateral.save();
		if (updated) {
			res.json({
				session_id: updated._id,
				dynamic_code: updated.dynamic_code,
				expire: updated.expiry.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'UPDATE_COLLATERAL_ERROR',
				message: 'Error occured while updating collateral'
			});
		}
	}
);

router.post('/cltr_dyna',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE).getTime();
		const code = await Util.generateDynamicCode();
		//const collateralPrice = await MarketPrice.findOne({}, {}, { sort: { 'timestamp' : -1 } }).exec();

		const newCollateral = new Collateral({
			dynamic_code: code,
			expiry: expiry,
			status: 'DYNA',
		});
		const created = await newCollateral.save();
		if (created) {
			res.json({
				session_id: created._id,
				dynamic_code: created.dynamic_code,
				expire: created.expiry.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'CREATE_COLLATERAL_ERROR',
				message: 'Error occured while creating collateral'
			});
		}
	}
);

// 담보 제공 리프레시
router.post('/cltr_dyna_refresh',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.session_id) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter session_id is required'
				}
			});
			return;
		}
		if (!mongoose.Types.ObjectId.isValid(req.body.session_id)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter session_id is invalid'
				}
			});
			return;
		}
		const collateral = await Collateral.findOne({_id: req.body.session_id}).exec();
		if (!collateral) {
			res.status(400).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Collateral id not found ${req.body.session_id}`
				}
			});
			return;
		}
		if (collateral.status !== 'DYNA') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Collateral status is ${collateral.status}`
				}
			});
			return;
		}
		if (collateral.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Payment expired'
				}
			});
			return;
		}
		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE);
		collateral.expiry = expiry;
		collateral.createdAt = new Date(timestamp);

		const code = await Util.generateDynamicCode();
		collateral.dynamic_code = code;

		const updated = await collateral.save();
		if (updated) {
			res.json({
				session_id: updated._id,
				dynamic_code: updated.dynamic_code,
				expire: updated.expiry.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'UPDATE_COLLATERAL_ERROR',
				message: 'Error occured while updating collateral'
			});
		}
	}
);

router.post('/cltr_cnfm',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.dynamic_code) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter dynamic_code is required'
				}
			});
			return;
		}
		if (!req.body.ex_market) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter ex_market is required'
				}
			});
			return;
		}
		if (!req.body.collateral_name) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter collateral_name is required'
				}
			});
			return;
		}
		if (!req.body.collateral_amount) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter collateral_amount is required'
				}
			});
			return;
		}
		const collateralAmount = Number(req.body.collateral_amount);
		if (isNaN(collateralAmount)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter collateral_amount is not a number'
				}
			});
			return;
		}

		const params = {
			dynamic_code: req.body.dynamic_code,
		};
		const collateral = await Collateral.findOne(params).exec();
		if (!collateral) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Data not found in server DB`
				}
			});
			return;
		}
		if (collateral.status !== 'DYNA') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Collateral status is ${collateral.status}`
				}
			});
			return;
		}
		if (collateral.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Expired'
				}
			});
			return;
		}

		//save
		if (req.user.v_bank_account === '' || req.user.v_bank_account === null || req.user.v_bank_account === undefined) {
			const virtualAccount = await Util.generateVirtualBankAccountNumber();
			req.user.v_bank = '기업은행';
			req.user.v_bank_account = virtualAccount;
		}
		req.user.collateral_amount += collateralAmount;

		const collateralPrice = await MarketPrice.findOne({}, {}, { sort: { 'timestamp' : -1 } }).exec();
		const price = +collateralPrice.close;
		const collateralValue = Math.floor(collateralAmount * price * 0.7);
		req.user.token_limit += collateralValue;
		req.user.token_balance += collateralValue;
		const updatedUser = await req.user.save();

		collateral.ex_market = req.body.ex_market;
		collateral.collateral_name = req.body.collateral_name;
		collateral.collateral_amount = collateralAmount;
		collateral.status = 'DONE';
		collateral.account_id = req.user._id;
		collateral.payer_signature = req.body.payer_signature;
		collateral.approval_id = Util.generateApprovalId();

		const updatedCollateral = await collateral.save();
		if (updatedCollateral) {
			// Firebase Cloud Message
			// admin.getMessaging().send({
			// 	data: {
			// 		message_name: 'CLTR_COMP_NOTI',
			// 		session_id: collateral._id,
			// 		noti_type: 'SET',
			// 		title: '',
			// 		offer_datetime: new Date(collateral.offer_date).getTime(),
			// 		collateral_name: collateral.collateral_name,
			// 		collateral_amount: collateral.collateral_amount.toString(),
			// 		collateral_price: collateral.collateral_price.toString(),
			// 		collateral_balance: req.user.collateral_balance.toString(),
			// 		token_name: req.user.token_name,
			// 		token_limit: req.user.token_limit,
			// 	},
			// 	token: req.user.fcm_token,
			// });
			res.json({
				result: 'OK'
			});
		} else {
			res.status(422).json({
				code: 'UPDATE_COLLATERAL_ERROR',
				message: 'Error occured while updating collateral'
			});
		}
	}
);

router.post('/cltr_cont',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.dynamic_code) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter dynamic_code is required'
				}
			});
			return;
		}

		const params = {
			dynamic_code: req.body.dynamic_code,
		};
		const collateral = await Collateral.findOne(params).exec();
		if (!collateral) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Data not found in server DB`
				}
			});
			return;
		}
		if (collateral.status !== 'INIT') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Collateral status is ${collateral.status}`
				}
			});
			return;
		}
		if (collateral.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Expired'
				}
			});
			return;
		}

		const collateralPrice = await MarketPrice.findOne({}, {}, { sort: { 'timestamp' : -1 } }).exec();
		const price = +collateralPrice.close;
		const collateralValue = Math.floor(collateral.collateral_amount * price * 0.7);

		res.json({
			session_id: collateral._id,
			ex_market: collateral.ex_market,
			offer_date: new Date(collateral.offer_date).getTime(),
			collateral_name: collateral.collateral_name,
			collateral_amount: collateral.collateral_amount ? collateral.collateral_amount.toString() : '0',
			collateral_price: price ? price.toString() : '0',
			collateral: collateralValue ? collateralValue.toString() : '0',
			token_name: 'MKRW',
			token_limit: '10000',
		});
	}
);

router.post('/cltr_comp',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.session_id) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter session_id is required'
				}
			});
			return;
		}
		if (!mongoose.Types.ObjectId.isValid(req.body.session_id)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter session_id is invalid'
				}
			});
			return;
		}

		const params = {
			_id: req.body.session_id,
		};
		const collateral = await Collateral.findOne(params).exec();
		if (!collateral) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Data not found in server DB`
				}
			});
			return;
		}
		if (collateral.status !== 'INIT') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Collateral status is ${collateral.status}`
				}
			});
			return;
		}
		if (collateral.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Expired'
				}
			});
			return;
		}

		//save
		if (req.user.v_bank_account === '' || req.user.v_bank_account === null || req.user.v_bank_account === undefined) {
			const virtualAccount = await Util.generateVirtualBankAccountNumber();
			req.user.v_bank = '기업은행';
			req.user.v_bank_account = virtualAccount;
		}
		req.user.collateral_amount += collateral.collateral_amount;

		const collateralPrice = await MarketPrice.findOne({}, {}, { sort: { 'timestamp' : -1 } }).exec();
		const price = +collateralPrice.close;
		const collateralValue = Math.floor(collateral.collateral_amount * price * 0.7);
		req.user.token_limit += collateralValue;
		req.user.token_balance += collateralValue;
		const updatedUser = await req.user.save();

		collateral.status = 'DONE';
		collateral.account_id = req.user._id;
		collateral.payer_signature = req.body.payer_signature;
		collateral.approval_id = Util.generateApprovalId();

		const updatedCollateral = await collateral.save();
		if (updatedCollateral) {
			// Firebase Cloud Message
			// admin.getMessaging().send({
			// 	data: {
			// 		message_name: 'CLTR_COMP_NOTI',
			// 		session_id: collateral._id,
			// 		noti_type: 'SET',
			// 		title: '',
			// 		offer_datetime: new Date(collateral.offer_date).getTime(),
			// 		collateral_name: collateral.collateral_name,
			// 		collateral_amount: collateral.collateral_amount.toString(),
			// 		collateral_price: collateral.collateral_price.toString(),
			// 		collateral_balance: req.user.collateral_balance.toString(),
			// 		token_name: req.user.token_name,
			// 		token_limit: req.user.token_limit,
			// 	},
			// 	token: req.user.fcm_token,
			// });
			res.json({
				result: 'OK'
			});
		} else {
			res.status(422).json({
				code: 'UPDATE_COLLATERAL_ERROR',
				message: 'Error occured while updating collateral'
			});
		}
	}
);

router.post('/cltr_rset',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.approval_id) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter approval_id is required'
				}
			});
			return;
		}
		if (!req.body.collateral_rls_amount) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter collateral_rls_amount is required'
				}
			});
			return;
		}
		const releaseAmount = req.body.collateral_rls_amount;
		if (isNaN(releaseAmount)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter collateral_rls_amount is not a number'
				}
			});
			return;
		}

		const collateral = await Collateral.findOne({approval_id: req.body.approval_id}).exec();
		if (!collateral) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Collateral data not found in server DB`
				}
			});
			return;
		}
		if (collateral.status === 'RESET') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS_RESET',
					message: `Collateral status is ${collateral.status}`
				}
			});
			return;
		}

		collateral.status = 'RESET';

		await collateral.save();
		res.json({
			result: 'OK'
		});
	}
);

module.exports = router;
