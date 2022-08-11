require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const VirtualAccount = require('./models/virtual_account');
const { generateRandomNumber } = require('./util');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');

	const codes = VirtualAccount.find({}, function(err, docs) {
		if (docs.length) {
			console.log('VirtualAccount:',docs.length);
			database.close();
		} else {
			const pool = generateRandomNumber(6, 100);
			const docs = pool.map(bank_account => ({
				bank_account: bank_account,
				used: false,
			}));

			VirtualAccount.insertMany(docs, (error, results) => {
				console.log('error:',error);
				console.log('docs:',results);

				database.close();
			});
		}
	});
});
