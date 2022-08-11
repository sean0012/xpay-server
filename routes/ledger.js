const Config = require('../config');

const express = require('express');
const router = express.Router();
const Ledger = require('../models/ledger');
const passport = require('passport');

router.get('/list',
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
		const ledgers = await Ledger.find().lean();
		res.json({
			ledgers: ledgers,
		});
	}
);

router.post('/pay',
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
		if (!req.body.bank_account) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter bank_account is required'
				}
			});
			return;
		}

		const newLedger = new Ledger({
			amount: amount,
			title: amount > 0 ? '은행이체 수입' : '은행계좌 지출',
			bank: {
				name: req.body.name,
				amount: amount,
				bank_account: req.body.bank_account,
				bank_name: req.body.bank_name,
				printed_content: req.body.printed_content,
			},
		});
		const created = await newLedger.save();

		res.json({
			result: 'OK'
		});
	}
);

module.exports = router;
