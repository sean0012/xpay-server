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
		console.log('req.user:',req.user);
		const transfers = await req.user.populate('transfers');
		console.log('transfers:',transfers);

		res.json({
			trades: transfers.transfers
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
		const expiry = new Date(timestamp + 30000).getTime();

		const code = Util.generateDynamicCode(req.user._id);
		console.log('dynamic_code:',code)

		const title = req.user.merchant_name ? req.user.merchant_name : '';

		const newTransfer = new Transfer({
			receiver_id: req.user._id,
			currency: 'MRF.KRW',
			settlement_date: (new Date('2022-07-31T00:00:00')).getTime(),
			settlement_name: '7월',
			settlement_status: 'WAITING',
			title: title,
			amount: amount,
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

module.exports = router;
