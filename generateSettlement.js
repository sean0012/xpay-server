require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const Settlement = require('./models/settlement');
const moment = require('moment');

mongoose.connect(mongoString);
const database = mongoose.connection;


database.on('error', (error) => {
	console.log(error);
});

database.once('connected', async () => {
	console.log('Database Connected');

	const docs = await generate(2, moment('2023-01-01T00:00:00.000Z'));

	Settlement.insertMany(docs, (results, error) => {
		console.log('docs:',results, error)

		database.close();
	});
});

const generate = async (settleIntervalHour, untilDate) => {
	const upcomingSettlement = await Settlement.findOne({done: false}).sort({'date': -1}).exec();
	let newSettlement = {
		start_date: upcomingSettlement.start_date,
		end_date: upcomingSettlement.end_date,
		date: upcomingSettlement.date,
	}

	let results = [];

	while(moment(newSettlement.start_date) < untilDate) {
	 	newSettlement.start_date = moment(newSettlement.start_date).add(settleIntervalHour, 'hours').toDate();
		newSettlement.end_date = moment(newSettlement.end_date).add(settleIntervalHour, 'hours').toDate();
		newSettlement.date = moment(newSettlement.date).add(settleIntervalHour, 'hours').toDate();

		// Deep clone new object
		const o = {
			start_date: newSettlement.start_date,
			end_date: newSettlement.end_date,
			date: newSettlement.date,
		};
		results.push(o);
	}

	return results;
};
