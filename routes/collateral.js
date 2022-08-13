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

// 담보
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

module.exports = router;
