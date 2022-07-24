require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const Settlement = require('./models/settlement');

mongoose.connect(mongoString);
const database = mongoose.connection;


database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');

	const docs = [
		{start_date: new Date('2022-07-01T00:00:00.000Z'), end_date: new Date('2022-07-31T23:59:59.999Z'), date: new Date('2022-08-10T00:00:00.000Z')},
		{start_date: new Date('2022-08-01T00:00:00.000Z'), end_date: new Date('2022-08-31T23:59:59.999Z'), date: new Date('2022-09-10T00:00:00.000Z')},
		{start_date: new Date('2022-09-01T00:00:00.000Z'), end_date: new Date('2022-09-30T23:59:59.999Z'), date: new Date('2022-10-10T00:00:00.000Z')},
	];

	Settlement.insertMany(docs, (error, results) => {
		console.log('error:',error)
		console.log('docs:',results)

		database.close();
	});
});
