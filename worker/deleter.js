const INTERVAL = 1 * 5 * 1000 // 10 min

require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const Transfer = require('../models/transfer');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');
	check();
});

const check = async () => {
	console.log('check');
	const expiredTransfers = await Transfer.find({status: 'INIT'}).lean();

	console.log('count:',expiredTransfers.length);

	setTimeout(check, INTERVAL)
};
