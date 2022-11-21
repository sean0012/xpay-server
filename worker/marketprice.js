const INTERVAL = 60 * 60 * 1000; // 1 hour

const MarketPrice = require('../models/market_price');
const axios = require('axios');

// https://api.coinone.co.kr/public/v2/chart/KRW/ETH?interval=1h
// {"timestamp":1668888000000,"open":"1672000.0","high":"1673000.0","low":"1671000.0","close":"1672000.0","target_volume":"10.8793","quote_volume":"18190829.2"},{
const endpoint = 'https://api.coinone.co.kr';
const quote = 'KRW';
const base = 'ETH';
const url = `${endpoint}/public/v2/chart/${quote}/${base}?interval=1h`;

const getMarketPrice = async () => {
	const response = await axios.get(url);

	if (!response.data.chart) {
		console.error('marketprice error: chart data empty');
	} else {
		console.log('marketetprice worker axios got response', response.data.chart.length);
		const docs = response.data.chart.map(item => ({
			updateOne: {
				filter: {timestamp: new Date(item.timestamp)},
				update: {
					'$set': {
						quote: quote,
						base: 'MRF',
						timestamp: new Date(item.timestamp),
						open: item.open,
						high: item.high,
						low: item.low,
						close: item.close,
						interval: '60',
						quote_volume: item.quote_volume,
					}
				},
				upsert: true,
			}
		}));
		
		const bulkRes = await MarketPrice.bulkWrite(docs);
		console.log('bulkResult:',bulkRes);

	}
	
	setTimeout(getMarketPrice, INTERVAL)
};

module.exports = { getMarketPrice };
