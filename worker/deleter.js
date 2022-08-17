const INTERVAL = 1 * 5 * 1000 // 10 min

require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const Transfer = require('../models/transfer');
const Collateral = require('../models/collateral');

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
	const expiredCollaterals = await Collateral.find({status: 'INIT'}).lean();

	console.log('expiredTransfers:',expiredTransfers.length);
	console.log('expiredCollaterals:',expiredCollaterals.length);

	setTimeout(check, INTERVAL)
};
