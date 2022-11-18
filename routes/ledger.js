const Config = require('../config');

const express = require('express');
const router = express.Router();
const Ledger = require('../models/ledger');
const Account = require('../models/account');
const passport = require('passport');
const moment = require('moment');

router.get('/hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const filter = {account_id: req.user._id};
		if (req.query.type) {
			if (req.query.type === 'in') {
				filter['banking.amount'] = {'$gt': 0};
			} else if (req.query.type === 'out') {
				filter['banking.amount'] = {'$lt': 0};
			}
		}
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
			filter.payment_time = {
				'$gte': fromDate,
				'$lt': toDate
			};
		}
		const ledgers = await Ledger.find(filter, {}, {
			sort: {createdAt: -1},
			limit: 20,
		}).lean();

		const data = ledgers.map(ledger => ({
			id: ledger._id,
			deposit_type: ledger.banking.deposit_type ? ledger.banking.deposit_type : 'O_BANK',
			name: ledger.banking.name,
			amount: req.query.type && req.query.type === 'out' ? Math.abs(ledger.banking.amount).toString() : ledger.banking.amount.toString(),
			bank_name: ledger.banking.bank_name,
			bank_account: ledger.banking.bank_account,
			printed_content: ledger.banking.printed_content,
			datetime: ledger.banking.datetime,
		}));

		const last_session_id = data.length && data[data.length - 1].id;

		const groupedData = await Ledger.aggregate([
			{'$match': {
				account_id: req.user._id,
				'banking.amount': {'$lt': 0},
			}},
			{'$group': {
				'_id': '$account_id',
				'total_amount': {'$sum': '$banking.amount'},
			}},
			{'$project': {
				'_id': 0,
				'total_amount': '$total_amount',
			}},
		]);
		const total_amount = groupedData.length ? Math.abs(groupedData[0].total_amount).toString() : '0';

		res.json({
			total_amount,
			last_session_id,
			data,
		});		
	}
);

router.get('/list',
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
		const ledgers = await Ledger.find(filter,	{},	{
			sort: {createdAt: -1},
			limit: 20,
		}).lean();
		const last_session_id = ledgers.length && ledgers[ledgers.length - 1].session_id;
		res.json({
			last_session_id,
			ledgers: ledgers,
		});
	}
);

router.post('/obank_cashin',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
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
		if (isNaN(amount) || amount === 0) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter amount is not a number'
				}
			});
			return;
		}
		if (!req.body.bank_name) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter bank_name is required'
				}
			});
			return;
		}
		if (!req.body.bank_account) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter bank_account is required'
				}
			});
			return;
		}

		let timestamp = null;
		if (req.body.date_time) {
			if (req.body.date_time.length === 8) {
				const year = req.body.date_time.substring(0, 4);
				const month = req.body.date_time.substring(4, 6);
				const day = req.body.date_time.substring(6, 8);
				const momentDatetime = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
				timestamp = momentDatetime.toDate();
			}
		}

		req.user.deposit += amount;
		const accountSaved = await req.user.save();

		const newLedger = new Ledger({
			amount: amount,
			title: '은행입금',
			banking: {
				name: req.body.bank_cs_name,
				amount: amount,
				datetime: req.body.date_time,
				timestamp: timestamp,
				bank_account: req.body.bank_account,
				bank_name: req.body.bank_name,
				printed_content: req.body.printed_content,
				deposit_type: 'O_BANK',
			},
			account_id: req.user._id,
		});
		const created = await newLedger.save();

		res.json({
			result: 'OK'
		});
	}
);

router.post('/cashout',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
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
		if (isNaN(amount) || amount === 0) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter amount is not a number'
				}
			});
			return;
		}
		if (!req.body.bank_name) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter bank_name is required'
				}
			});
			return;
		}
		if (!req.body.bank_account) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter bank_account is required'
				}
			});
			return;
		}

		let timestamp = null;
		if (req.body.date_time) {
			if (req.body.date_time.length === 8) {
				const year = req.body.date_time.substring(0, 4);
				const month = req.body.date_time.substring(4, 6);
				const day = req.body.date_time.substring(6, 8);
				const momentDatetime = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
				timestamp = momentDatetime.toDate();
			}
		}

		req.user.deposit -= amount;
		const accountSaved = await req.user.save();

		const newLedger = new Ledger({
			amount: -amount,
			title: '은행출금',
			banking: {
				name: req.body.bank_cs_name,
				amount: -amount,
				datetime: req.body.date_time,
				timestamp: timestamp,
				bank_account: req.body.bank_account,
				bank_name: req.body.bank_name,
				printed_content: req.body.printed_content,
				deposit_type: 'O_BANK',
			},
			account_id: req.user._id,
		});
		const created = await newLedger.save();
		res.json({
			result: 'OK' // NOT_ENOUGH_BALANCE
		});
	}
);

module.exports = router;
