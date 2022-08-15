require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const MarketPrice = require('./models/market_price');
const moment = require('moment');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', async () => {
	console.log('Database Connected');

	const newMarketPrice = new MarketPrice({
		timestamp: '1582253100000',
		open: '100',
		high: '101',
		low: '99',
		close: '100',
		interval: '60m',
		quote_volume: '0',
	});
	const created = await newMarketPrice.save();
	console.log('created:',created);

	database.close();
});
