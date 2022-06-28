require('dotenv').config();

const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transfer = require('../models/transfer');
const passport = require('passport');
const Util = require('../util');

// 거래 내역
router.get('/',
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
router.post('/payment_init',
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
		const amount = Number(req.body.amount)
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
		const expiry = new Date(timestamp + 60000).getTime();

		const code = Util.generateDynamicCode(req.user._id);
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
		console.log('created:',created);

		if (created) {
			res.json({
				dynamic_code: code,
				expire: expiry,
			});
		} else {
			res.status(422).json({
				code: 'CREATE_TRANSFER_ERROR',
				message: 'Error occured while creating transfer'
			});
		}
	}
);

router.post('/payment_cont',
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

router.post('/payment_comp',
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
		console.log('transfer:',transfer.amount)
		console.log('user:',req.user.token_balance)
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
		console.log('user:',updatedUser);

		transfer.status = 'PAID';
		transfer.sender_id = req.user._id;
		const updatedTransfer = await transfer.save();
		console.log('updatedTransfer:',updatedTransfer)

		res.json(updatedTransfer);
	}
);

module.exports = router;
