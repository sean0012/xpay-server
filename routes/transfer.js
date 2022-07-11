require('dotenv').config();

const QR_EXPIRE = 3 * 60 * 1000;

const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transfer = require('../models/transfer');
const passport = require('passport');
const Util = require('../util');
const { v1: uuidv1 } = require('uuid');

// 거래 내역
router.get('/trade_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const transfers = await Transfer.find({
			'$or': [
				{sender_id: req.user._id},
				{receiver_id: req.user._id},
			]
		}).exec();

		res.json({
			trades: transfers
		});
	}
);

// 결제 요청
router.post('/pamt_init',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		// validate params
		if (!req.body.amount) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter amount is required'
				}
			});
			return;
		}
		const amount = Number(req.body.amount);
		if (isNaN(amount)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter amount is not a number'
				}
			});
			return;
		}
		if (req.body.items) {
			const valid = Util.checkPrice(amount, req.body.items);
			if (!valid) {
				res.status(400).json({
					error: {
						code: 'INVALID_PRICE',
						message: 'Items price * quantity !== amount'
					}
				});
				return;
			}
		}
		const timestamp = Date.now();
		const expiry = new Date(timestamp + QR_EXPIRE).getTime();
		console.log('expiry:',expiry)

		const code = await Util.generateDynamicCode();
		console.log('dynamic_code:',code)

		const newTransfer = new Transfer({
			receiver_id: req.user._id,
			receiver_name: req.user.merchant_name,
			currency: 'MRF.KRW',
			settlement_date: (new Date('2022-07-31T00:00:00')).getTime(),
			settlement_name: '7월',
			settlement_status: 'WAITING',
			amount: amount,
			items: req.body.items,
			fee: amount * 0.01,
			date: Date.now(),
			type: 'PAYMENT',
			status: 'INIT',
			dynamic_code: code,
			expiry: expiry,
		});
		const created = await newTransfer.save();
		if (created) {
			res.json({
				session_id: created._id,
				dynamic_code: created.dynamic_code,
				expire: created.expiry.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'CREATE_TRANSFER_ERROR',
				message: 'Error occured while creating transfer'
			});
		}
	}
);

// 결제 요청 리프레시
router.post('/pamt_init_refresh',
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
		const transfer = await Transfer.findOne({_id: req.body.session_id}).exec();
		if (transfer.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Payment expired'
				}
			});
			return;
		}
		const timestamp = Date.now();
		const expiry = new Date(timestamp + QR_EXPIRE).getTime();
		transfer.expiry = expiry;

		const code = await Util.generateDynamicCode();
		transfer.dynamic_code = code;

		const updated = await transfer.save();
		if (updated) {
			res.json({
				session_id: updated._id,
				dynamic_code: updated.dynamic_code,
				expire: updated.expiry.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'UPDATE_TRANSFER_ERROR',
				message: 'Error occured while updating transfer'
			});
		}
	}
);

router.post('/pamt_cont',
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
		const transfer = await Transfer.findOne(params).exec();
		if (!transfer) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Payment data not found in server DB`
				}
			});
			return;
		}
		if (transfer.status !== 'INIT') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Payment status is ${transfer.status}`
				}
			});
			return;
		}
		if (transfer.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Payment expired'
				}
			});
			return;
		}

		res.json({
			session_id: transfer._id,
			receiver_id: transfer.receiver_id,
			receiver_name: transfer.receiver_name,
			currency: transfer.currency,
			amount: transfer.amount,
			items: transfer.items,
			dynamic_code: transfer.dynamic_code,
			type: transfer.type,
		});
	}
);

router.post('/pamt_comp',
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

		const params = {
			_id: req.body.session_id,
		};
		const transfer = await Transfer.findOne(params).exec();
		if (!transfer) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Payment data not found in server DB`
				}
			});
			return;
		}
		if (transfer.status !== 'INIT') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS',
					message: `Payment status is ${transfer.status}`
				}
			});
			return;
		}
		if (req.user.token_balance < transfer.amount) {
			res.status(422).json({
				error: {
					code: 'NOT_ENOUGH_BALANCE',
					message: 'Not enough balance'
				}
			});
			return;
		}
		if (transfer.expiry < Date.now()) {
			res.status(422).json({
				error: {
					code: 'EXPIRED',
					message: 'Payment expired'
				}
			});
			return;
		}

		//save
		req.user.token_balance = req.user.token_balance - transfer.amount;
		const updatedUser = await req.user.save();

		const merchant = await Account.findOneAndUpdate(
			{_id: transfer.receiver_id},
			{$inc: {token_balance: transfer.amount}}
		).exec();
		console.log('merchant findOneAndUpdate:',merchant)

		transfer.approval_id = uuidv1();
		transfer.status = 'PAID';
		transfer.sender_id = req.user._id;
		const updatedTransfer = await transfer.save();
		if (updatedTransfer) {
			res.json({
				result: 'OK'
			});
		} else {
			res.status(422).json({
				code: 'UPDATE_TRANSFER_ERROR',
				message: 'Error occured while updating transfer'
			});
		}
	}
);

// PAYEE 결제취소 요청
router.post('/pamt_canc',
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

		const transfer = await Transfer.findOne({approval_id: req.body.approval_id}).exec();
		if (!transfer) {
			res.status(422).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Payment data not found in server DB`
				}
			});
			return;
		}
		if (transfer.status === 'CANCEL') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS_CANCEL',
					message: `Payment status is ${transfer.status}`
				}
			});
			return;
		}

		const merchant = await Account.findOneAndUpdate(
			{_id: transfer.receiver_id},
			{$inc: {token_balance: -transfer.amount}}
		).exec();

		const payer = await Account.findOneAndUpdate(
			{_id: transfer.sender_id},
			{$inc: {token_balance: transfer.amount}}
		).exec();

		transfer.status = 'CANCEL'
		const updatedTransfer = await transfer.save();
		if (updatedTransfer) {
			res.json({
				result: 'OK'
			});
		} else {
			res.status(422).json({
				code: 'CANCEL_TRANSFER_ERROR',
				message: 'Error occured while cancel update transfer'
			});
		}
	}
);

module.exports = router;
