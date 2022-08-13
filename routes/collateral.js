const Config = require('../config');

const mongoose = require('mongoose');
const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Collateral = require('../models/collateral');
const passport = require('passport');
const Util = require('../util');

// 담보 내역
router.get('/cltr_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const collaterals = await Collateral.find({
			account_id: req.user._id,
		}, {}, { sort: { createdAt: -1 }}).lean();

		res.json({
			cltr_hist: collaterals
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
		if (!req.body.collateral_price) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter collateral_price is required'
				}
			});
			return;
		}
		const collateralAmount = Number(req.body.collateral_amount);
		const collateralPrice = Number(req.body.collateral_price);
		if (isNaN(collateralAmount)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter collateral_amount is not a number'
				}
			});
			return;
		}
		if (isNaN(collateralPrice)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter collateral_price is not a number'
				}
			});
			return;
		}

		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE).getTime();
		const code = await Util.generateDynamicCode();

		const newCollateral = new Collateral({
			collateral_name: req.body.collateral_name,
			collateral_amount: collateralAmount,
			collateral_price: collateralPrice,
			ex_market: req.body.ex_market,
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
		if (collateral.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Expired'
				}
			});
			return;
		}

		const collateralValue = Math.floor(collateral.collateral_amount * collateral.collateral_price * 0.7);

		res.json({
			session_id: collateral._id,
			ex_market: collateral.ex_market,
			collateral_name: collateral.collateral_name,
			collateral_amount: collateral.collateral_amount,
			collateral_price: collateral.collateral_price,
			collateral: collateralValue,
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
		const virtualAccount = await Util.generateVirtualBankAccountNumber();
		req.user.v_bank = '기업은행';
		req.user.v_bank_account = virtualAccount;
		req.user.collateral_amount += collateral.collateral_amount;
		req.user.collateral += collateral.collateral;
		const updatedUser = await req.user.save();


		collateral.status = 'DONE';
		collateral.account_id = req.user._id;
		collateral.payer_signature = req.body.payer_signature;

		const updatedCollateral = await collateral.save();
		if (updatedCollateral) {
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

module.exports = router;
