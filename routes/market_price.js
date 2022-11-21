const Config = require('../config');

const express = require('express');
const router = express.Router();
const MarketPrice = require('../models/market_price');
const passport = require('passport');

router.get('/',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const chart = await MarketPrice.find().lean();
		res.json({
			chart,
		});
	}
);

module.exports = router;
