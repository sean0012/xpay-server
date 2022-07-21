require('dotenv').config();

const QR_EXPIRE = 3 * 60 * 1000;

const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transfer = require('../models/transfer');
const passport = require('passport');
const Util = require('../util');

// 거래 내역
router.get('/trade_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const transfers = await Transfer.find({
			'$or': [
				{sender_id: req.user._id},
				{receiver_id: req.user._id},
			]
		},
		{},
		{
			sort: {
				createdAt: -1,
			}
		}).lean();

		const trades = transfers.map(transfer => ({
			session_id: transfer._id,
			merchant_name: transfer.receiver_name,
			currency: transfer.currency,
			amount: transfer.amount,
			items: transfer.items.map(item => ({
				name: item.name,
				option: item.option,
				price: +item.price,
				quantity: +item.quantity,
			})),
			fee: transfer.fee,
			dynamic_code: transfer.dynamic_code,
			expiry: new Date(transfer.expiry).getTime(),
			type: transfer.type,
			status: transfer.status,
			approval_id: transfer.approval_id,
			points_spent: transfer.points_spent,
			points_gained: transfer.points_gained,
			memo: transfer.memo,
			payer_signature: transfer.payer_signature,
			created_at: new Date(transfer.createdAt).getTime(),
		}));

		res.json({
			trades,
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

		const items = transfer.items.map(item => ({
			name: item.name,
			option: item.option,
			price: item.price,
			quantity: item.quantity,
		}));

		res.json({
			session_id: transfer._id,
			merchant_name: transfer.receiver_name,
			currency: transfer.currency,
			amount: transfer.amount,
			items,
			dynamic_code: transfer.dynamic_code,
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
		console.log('user points:',req.user.points)
		console.log('points using:', req.body.payer_points_using)
		if (req.body.payer_points_using) {
			const payerPointsUsing = Number(req.body.payer_points_using);
			if (isNaN(payerPointsUsing)) {
				res.status(400).json({
					error: {
						code: 'INVALID_PARAMS',
						message: 'Parameter payer_points_using is not a number'
					}
				});
				return;
			}
			if (payerPointsUsing > req.user.points) {
				res.status(422).json({
					error: {
						code: 'NOT_ENOUGH_POINTS',
						message: `Using points: ${payerPointsUsing} Payer points: ${req.user.points}`
					}
				});
				return;
			}
			if (payerPointsUsing > transfer.amount) {
				res.status(422).json({
					error: {
						code: 'USING_TOO_MUCH_POINTS',
						message: `Using points: ${payerPointsUsing} Pay amount: ${transfer.amount}`
					}
				});
				return;
			}
		}

		//save
		let amountToDeductFromPayer = transfer.amount;
		if (req.body.payer_points_using) {
			amountToDeductFromPayer -= +req.body.payer_points_using;
			req.user.points -= +req.body.payer_points_using;
		}
		req.user.token_balance -= amountToDeductFromPayer;
		const updatedUser = await req.user.save();

		const inc = {token_balance: transfer.amount};
		if (req.body.payer_points_using) {
			inc.points = +req.body.payer_points_using;
		}

		const merchant = await Account.findOneAndUpdate(
			{_id: transfer.receiver_id},
			{$inc: inc}
		).exec();
		console.log('merchant findOneAndUpdate:',merchant)

		transfer.approval_id = Util.generateApprovalId();
		transfer.status = 'PAID';
		transfer.sender_id = req.user._id;
		transfer.memo = req.body.memo_message;
		transfer.payer_signature = req.body.payer_signature;

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

		const merchantInc = {token_balance: -transfer.amount};
		// if (transfer.payer_points_using) {
		// 	merchantInc.points
		// }
		const merchant = await Account.findOneAndUpdate(
			{_id: transfer.receiver_id},
			{$inc: merchantInc}
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
