const Config = require('../config');

const mongoose = require('mongoose');
const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transfer = require('../models/transfer');
const Settlement = require('../models/settlement');
const passport = require('passport');
const Util = require('../util');
const moment = require('moment');

// 거래 내역
router.get('/trade_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const filter = {
			'$or': [
				{sender_id: req.user._id},
				{receiver_id: req.user._id},
			]
		};

		let type = 'PAYMENT';
		if (req.query.type) {
			type = req.query.type.toUpperCase();
			filter.type = type;
		}

		if (req.query.last_session_id) {
			filter._id = {
				'$lt': req.query.last_session_id
			};
		}
		let total_amount = null;
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
			filter.payment_time = {
				'$gte': fromDate,
				'$lt': toDate
			};

			const {_id, ...wholeMonthFilter} = filter;
			const wholeMonthTransfers = await Transfer.find(wholeMonthFilter).select({'_id': 0, 'amount': 1}).lean();
			total_amount = 0;
			for (let t of wholeMonthTransfers) {
				total_amount += t.amount;
			}
			total_amount = total_amount.toString();
		}
		const transfers = await Transfer.find(filter,	{},	{
			sort: {createdAt: -1},
			limit: 20,
		}).lean();

		const data = transfers.map(transfer => ({
			session_id: transfer._id,
			payee: {
				name: transfer.receiver_name,
				address: transfer.receiver_address,
				registration: transfer.receiver_registration,
				phone: transfer.receiver_phone,
				wallet: transfer.receiver_wallet,
			},
			currency: transfer.currency,
			amount: transfer.amount ? transfer.amount.toString() : '0',
			items: transfer.items ? transfer.items.map(item => ({
				name: item.name,
				option: item.option,
				price: item.price ? item.price.toString() : undefined,
				quantity: item.quantity ? item.quantity.toString() : undefined,
			})) : [],
			fee: transfer.fee ? transfer.fee.toString() : '0',
			type: transfer.type,
			status: transfer.status,
			approval_id: transfer.approval_id,
			payer_wallet: transfer.wallet,
			payer_points_using: transfer.payer_points_using ? transfer.payer_points_using.toString() : '0',
			payer_points_gained: transfer.payer_points_gained ? transfer.payer_points_gained.toString() : '0',
			memo: transfer.memo,
			created_at: new Date(transfer.createdAt).getTime(),
			trade_datetime: new Date(transfer.payment_time).getTime(),
			settlement: transfer.settlement
		}));

		const last_session_id = data.length && data[data.length - 1].session_id;

		res.json({
			data,
			total_amount,
			last_session_id,
		});
	}
);

// 포인트 내역
router.get('/point_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const paramStatus = req.query.status ? req.query.status.toUpperCase() : undefined;
		const filter = {
			'$or': [
				{sender_id: req.user._id},
				{receiver_id: req.user._id},
			],
			'$or': [
				{payer_points_using: {$gt: 0}},
				{payer_points_gained: {$gt: 0}},
			],
		};
		if (paramStatus) filter.status = paramStatus;
		const transfers = await Transfer.find(filter, {}, {
			sort: {
				createdAt: -1,
			}
		}).lean();

		const data = transfers.map(transfer => ({
			session_id: transfer._id,
			currency: transfer.currency,
			//amount: transfer.amount,
			title: transfer.receiver_name,
			type: transfer.type,
			status: transfer.status,
			payer_points_using: transfer.payer_points_using ? transfer.payer_points_using.toString() : '0',
			payer_points_gained: transfer.payer_points_gained ? transfer.payer_points_gained.toString() : '0',
			trade_datetime: new Date(transfer.payment_time).getTime(),
		}));

		res.json({
			point_balance: '0',
			data,
		});
	}
);

// 구매자 결제요청
router.post('/pamt_dyna', passport.authenticate('bearer', { session: false }), async (req, res) => {
	const upcomingSettlement = await Settlement.findOne({done: false}).sort('date').exec();
	if (!upcomingSettlement) {
		res.status(400).json({
			error: {
				code: 'SETTLEMENT_NOT_FOUND',
				message: 'No available upcoming settlement'
			}
		});
		return;
	}
	const timestamp = Date.now();
	const expiry = new Date(timestamp + Config.QR_EXPIRE).getTime();
	const code = await Util.generateDynamicCode();
	const newTransfer = new Transfer({
		sender_id: req.user._id,
		sender_wallet: req.user.wallet,
		currency: 'MKRW',
		settlement: {
			date: upcomingSettlement.date,
			done: upcomingSettlement.done,
		},
		type: 'PAYMENT',
		status: 'INIT',
		dynamic_code: code,
		expiry: expiry,
	});
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
		} else {
			newTransfer.payer_points_using = payerPointsUsing;
		}
	}
	const created = await newTransfer.save();
	if (created) {
		res.json({
			session_id: created._id,
			dynamic_code: created.dynamic_code,
			expire: created.expiry.getTime(),
		});
	}
});

// 구매자 결제 요청 리프레시
router.post('/pamt_dyna_refresh',
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
		const transfer = await Transfer.findOne({_id: req.body.session_id}).exec();
		if (!transfer) {
			res.status(400).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Transfer id not found ${req.body.session_id}`
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
		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE);
		transfer.expiry = expiry;
		transfer.createdAt = new Date(timestamp);

		const code = await Util.generateDynamicCode();
		transfer.dynamic_code = code;

		const updated = await transfer.save();
		if (updated) {
			res.json({
				session_id: updated._id,
				dynamic_code: updated.dynamic_code,
				expire: updated.expiry.getTime(),
			});
		}
	}
);

router.post('/pamt_cnfm',
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

		const feeRate = req.user.merchant_fee_rate ? req.user.merchant_fee_rate : Config.DEFAULT_FEE_RATE;
		const pointsRate = req.user.merchant_points_rate ? req.user.merchant_points_rate : Config.DEFAULT_POINTS_RATE;

		transfer.receiver_id = req.user._id;
		transfer.receiver_name = req.user.merchant_name;
		transfer.receiver_address = req.user.address;
		transfer.receiver_registration = req.user.business_registration;
		transfer.receiver_phone = req.user.phone;
		transfer.amount = amount;
		transfer.items = req.body.items;
		transfer.fee = amount * feeRate;
		transfer.payer_points_gained = amount * feeRate * pointsRate;

		const payer = await Account.findOne({_id: transfer.sender_id}).exec();
		let amountToDeductFromPayer = amount;

		if (transfer.payer_points_using) {
			amountToDeductFromPayer -= transfer.payer_points_using;
			payer.points -= transfer.payer_points_using;
		}
		payer.token_balance -= amountToDeductFromPayer;
		payer.payment_thismonth += amountToDeductFromPayer;
		const updatedPayer = await payer.save();

		let marchantGain = amount;
		if (transfer.fee) marchantGain -= transfer.fee;

		req.user.token_balance += marchantGain;
		const updatedUser = await req.user.save();

		transfer.approval_id = Util.generateApprovalId();
		transfer.status = 'PAID';
		transfer.payment_time = Date.now();

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
		const upcomingSettlement = await Settlement.findOne({done: false}).sort('date').exec();
		if (!upcomingSettlement) {
			res.status(400).json({
				error: {
					code: 'SETTLEMENT_NOT_FOUND',
					message: 'No available upcoming settlement'
				}
			});
			return;
		}
		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE).getTime();
		const code = await Util.generateDynamicCode();
		const feeRate = req.user.merchant_fee_rate ? req.user.merchant_fee_rate : Config.DEFAULT_FEE_RATE;
		const pointsRate = req.user.merchant_points_rate ? req.user.merchant_points_rate : Config.DEFAULT_POINTS_RATE;

		const newTransfer = new Transfer({
			receiver_id: req.user._id,
			receiver_wallet: req.user.wallet,
			receiver_name: req.user.merchant_name,
			receiver_address: req.user.address,
			receiver_registration: req.user.business_registration,
			receiver_phone: req.user.phone,
			currency: 'MKRW',
			settlement: {
				date: upcomingSettlement.date,
				done: upcomingSettlement.done,
			},
			amount: amount,
			items: req.body.items,
			fee: amount * feeRate,
			payer_points_gained: amount * feeRate * pointsRate,
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
		if (!mongoose.Types.ObjectId.isValid(req.body.session_id)) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter session_id is invalid'
				}
			});
			return;
		}
		const transfer = await Transfer.findOne({_id: req.body.session_id}).exec();
		if (!transfer) {
			res.status(400).json({
				error: {
					code: 'DATA_NOT_FOUND',
					message: `Transfer id not found ${req.body.session_id}`
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
		const timestamp = Date.now();
		const expiry = new Date(timestamp + Config.QR_EXPIRE);
		transfer.expiry = expiry;
		transfer.createdAt = new Date(timestamp);

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
			price: item.price ? item.price.toString() : '0',
			quantity: item.quantity ? item.quantity.toString() : '0',
		}));

		res.json({
			session_id: transfer._id,
			merchant_name: transfer.receiver_name,
			currency: transfer.currency,
			amount: transfer.amount ? transfer.amount.toString() : '0',
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
			transfer.payer_points_using = +req.body.payer_points_using;
		}
		req.user.token_balance -= amountToDeductFromPayer;
		req.user.payment_thismonth += amountToDeductFromPayer;
		const updatedUser = await req.user.save();

		let marchantGain = transfer.amount;
		if (transfer.fee) marchantGain -= transfer.fee;

		const merchant = await Account.findOneAndUpdate(
			{_id: transfer.receiver_id},
			{$inc: {token_balance: marchantGain}}
		).exec();
		console.log('merchant findOneAndUpdate:',merchant)

		transfer.approval_id = Util.generateApprovalId();
		transfer.status = 'PAID';
		transfer.sender_id = req.user._id;
		transfer.sender_wallet = req.user.wallet;
		transfer.memo = req.body.memo_message;
		transfer.payer_signature = req.body.payer_signature;
		transfer.payment_time = Date.now();

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
		if (transfer.status === 'CANCELED') {
			res.status(422).json({
				error: {
					code: 'INVALID_STATUS_CANCELED',
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

		transfer.status = 'CANCELED'
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

// 송금진행 대상
router.post('/remi_init',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		if (!req.body.static_code) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter static_code is required'
				}
			});
			return;
		}

		const keyword = req.body.static_code;

		const accounts = await Account.find({
			'$or': [
				{'wallet': {'$regex': keyword, '$options': 'i'}},
				{'phone': {'$regex': keyword, '$options': 'i'}},
			]
		}).limit(10).sort({
			last_name: -1,
			first_name: -1,
		}).select({_id: 1, wallet: 1, phone: 1, first_name: 1, last_name: 1}).lean();

		res.json({
			peer_content: accounts
		});
	}
);

// 송금 승인
router.post('/remi_comp',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		if (!req.body.wallet) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter wallet is required'
				}
			});
			return;
		}
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
		const today = new Date();
		let yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1)

		const past24hRemittance = await Transfer.findOne({
			type: 'REMIT',
			sender_id: req.user._id,
			createdAt: { $gt: yesterday },
		});
		if (past24hRemittance) {
			res.status(422).json({
				error: {
					code: 'RATE_LIMIT_24H',
					message: 'Remittance once only per 24h'
				}
			});
			return;
		}

		req.user.token_balance -= amount;
		const sender = await req.user.save();

		const receiver = await Account.findOne({wallet: req.body.wallet}).exec();
		if (!receiver) {
			res.status(422).json({
				error: {
					code: 'WALLET_NOT_FOUND',
					message: 'Wallet not found'
				}
			});
			return;
		}
		receiver.token_balance += amount;
		await receiver.save();
		const receiverFullname = `${receiver.last_name} ${receiver.first_name}`;

		const newRemittance = new Transfer({
			sender_id: req.user._id,
			sender_wallet: req.user.wallet,
			receiver_id: receiver._id,
			receiver_wallet: receiver.wallet,
			receiver_name: receiverFullname.trim(),
			currency: 'MKRW',
			amount: amount,
			type: 'REMIT',
			memo: req.body.memo_message,
			payer_signature: req.body.payer_signature,
			payment_time: Date.now(),
		});
		const created = await newRemittance.save();
		if (created) {
			res.json({
				wallet: created.wallet,
				first_name: receiver.first_name,
				last_name: receiver.last_name,
				datetime: created.createdAt.getTime(),
			});
		} else {
			res.status(422).json({
				code: 'CREATE_TRANSFER_ERROR',
				message: 'Error occured while creating transfer'
			});
		}
	}
);

// 송금 요청
router.post('/remi_cnfm',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		if (!req.body.wallet) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter wallet is required'
				}
			});
			return;
		}
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
		const receiver = await Account.findOne({wallet: req.body.wallet}).exec();
		if (!receiver) {
			res.status(422).json({
				error: {
					code: 'WALLET_NOT_FOUND',
					message: 'Wallet not found'
				}
			});
			return;
		}
		res.json({
			wallet: req.body.wallet,
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			amount: req.body.amount,
		});
	}
);

module.exports = router;
