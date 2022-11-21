const Config = require('../config');

const express = require('express');
const router = express.Router();
const MarketPrice = require('../models/market_price');
const passport = require('passport');
const moment = require('moment');

router.get('/coinprice_hist',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		if (!req.query.pair) {
			res.status(400).json({
				error: {
					code: 'MISSING_REQUIRED_PARAMS',
					message: 'Parameter pair is required'
				}
			});
			return;
		}
		const pair = req.query.pair.split('-');
		if (pair.length !== 2) {
			res.status(400).json({
				error: {
					code: 'INVALID_PARAMS',
					message: 'Parameter pair is invalid'
				}
			});
			return;
		}
		const base = pair[0];
		const quote = pair[1];
		const filter = {base: base, quote: quote};

		let interval = '1440';
		if (req.query.interval) {
			interval = req.query.interval;
		}
		filter.interval = interval;

		let daysAgo = 7;
		if (interval === '60') {
			daysAgo = 7;
		} else if (interval === '1440') {
			daysAgo = 120;
		}
		let start = moment().subtract(daysAgo, 'day');
		let end = moment();

		if (req.query.start) {
			const startTimestamp = Number(req.query.start);
			if (isNaN(startTimestamp)) {
				res.status(400).json({
					error: {
						code: 'INVALID_PARAMS',
						message: 'Parameter start is invalid'
					}
				});
				return;
			}
			start = moment(startTimestamp);
		}

		if (req.query.end) {
			const endTimestamp = Number(req.query.end);
			if (isNaN(endTimestamp)) {
				res.status(400).json({
					error: {
						code: 'INVALID_PARAMS',
						message: 'Parameter end is invalid'
					}
				});
				return;
			}
			end = moment(endTimestamp);
		}

		filter.timestamp = {
			'$gte': start,
			'$lte': end
		};
		console.log('coinprice_hist:',pair, start, end, interval);

		const data = await MarketPrice.find(filter, {}, {
			limit: 200,
			sort: {timestamp: -1},
		}).lean();

		const chart = data.map(item => ({
			timestamp: new Date(item.timestamp).getTime(),
			open: item.open,
			high: item.high,
			low: item.low,
			close: item.close,
			quote_volume: item.quote_volume,
		}))
		res.json({
			chart,
		});
	}
);

module.exports = router;
