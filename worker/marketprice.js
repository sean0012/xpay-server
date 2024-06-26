const INTERVAL = 60 * 60 * 1000; // 1 hour

const MarketPrice = require('../models/market_price');
const axios = require('axios');

const endpoint = 'https://api.coinone.co.kr';
const quote = 'KRW';
const base = 'ETH';


const coinoneIntervalTable = {
	'60': '1h',
	'1440': '1d'
};
//"1m" "3m" "5m" "15m" "30m" "1h" "2h" "4h" "6h" "1d" "1w"

const getMarketPrice = async (interval) => {
	const coinoneInterval = coinoneIntervalTable[interval];
	console.log('coinoneInterval:', coinoneInterval);
	const url = `${endpoint}/public/v2/chart/${quote}/${base}?interval=${coinoneInterval}`;
	try {
		const response = await axios.get(url);

		if (!response.data.chart) {
			console.error('marketprice error: chart data empty', interval, response.data);
		} else {
			const docs = response.data.chart.map(item => ({
				updateOne: {
					filter: {timestamp: new Date(item.timestamp), interval: interval},
					update: {
						'$set': {
							quote: quote,
							base: 'MRF',
							timestamp: new Date(item.timestamp),
							open: item.open,
							high: item.high,
							low: item.low,
							close: item.close,
							interval: interval,
							quote_volume: item.quote_volume,
						}
					},
					upsert: true,
				}
			}));
			const bulkRes = await MarketPrice.bulkWrite(docs);
		}
	} catch (error) {
    console.error(error);
  }
	
	setTimeout(() => {
		getMarketPrice(interval);
	}, INTERVAL);
};

module.exports = { getMarketPrice };
