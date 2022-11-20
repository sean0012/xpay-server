require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const DynamicCode = require('./models/dynamic_code');
const { generateRandomNumber } = require('./util');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');

	const codes = DynamicCode.find({}, function(err, docs) {
		if (docs.length) {
			database.close();
			console.log('codes:',docs.length)
		} else {
			const pool = generateRandomNumber(7, 23);
			const poolMapped = pool.map(code => ({
				code: code,
				used: false,
			}));

			DynamicCode.insertMany(poolMapped, (error, results) => {
				console.log('error:',error)
				console.log('poolMapped:',results)

				database.close();
			});
		}
	});
});
