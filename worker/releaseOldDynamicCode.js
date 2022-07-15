const INTERVAL = 1 * 6 * 1000; // 1 hour


require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const DynamicCode = require('../models/dynamic_code');

const check = async () => {
	const ago = Date.now()//new Date(Date.now().getTime() - 5 * 60 * 1000);
	console.log('ago:',ago);
	const count = await DynamicCode.countDocuments(
		{
			used: true,
			updatedAt: {
				$lt: ago
			}
		}
	);
	console.log('check', count)
	setTimeout(check, INTERVAL);
};


mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');
	check();
});
