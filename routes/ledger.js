const Config = require('../config');

const express = require('express');
const router = express.Router();
const Ledger = require('../models/ledger');
const Account = require('../models/account');
const passport = require('passport');
const moment = require('moment');

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
		if (req.user.user_type !== 'ADMIN') {
			res.status(403).json({
				error: {
					code: 'FORBIDDEN',
					message: `Forbidden`
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
		const accountByBankAccount = await Account.findOne({
			v_bank: req.body.bank_name,
			v_bank_account: req.body.bank_account,
		}).exec();
		if (!accountByBankAccount) {
			res.status(400).json({
				error: {
					code: 'ACCOUNT_NOT_FOUND',
					message: 'Virtual Bank Account not found'
				}
			});
			return;
		}

		accountByBankAccount.deposit += amount;
		const accountSaved = await accountByBankAccount.save();

		const newLedger = new Ledger({
			amount: amount,
			title: amount > 0 ? '은행이체 수입' : '은행계좌 지출',
			banking: {
				name: req.body.bank_cs_name,
				amount: amount,
				bank_account: req.body.bank_account,
				bank_name: req.body.bank_name,
				printed_content: req.body.printed_content,
			},
			account_id: accountByBankAccount._id,
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
		res.json({
			result: 'OK' // NOT_ENOUGH_BALANCE
		});
	}
);

module.exports = router;
