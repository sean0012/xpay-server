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
		{start_date: new Date('2022-08-02T00:00:00.000Z'), end_date: new Date('2022-08-02T01:59:59.999Z'), date: new Date('2022-08-02T02:10:00.000Z')},
		{start_date: new Date('2022-08-02T02:00:00.000Z'), end_date: new Date('2022-08-02T03:59:59.999Z'), date: new Date('2022-08-02T04:10:00.000Z')},
		{start_date: new Date('2022-08-02T04:00:00.000Z'), end_date: new Date('2022-08-02T05:59:59.999Z'), date: new Date('2022-08-02T06:10:00.000Z')},
		{start_date: new Date('2022-08-02T06:00:00.000Z'), end_date: new Date('2022-08-02T07:59:59.999Z'), date: new Date('2022-08-02T08:10:00.000Z')},
		{start_date: new Date('2022-08-02T08:00:00.000Z'), end_date: new Date('2022-08-02T09:59:59.999Z'), date: new Date('2022-08-02T10:10:00.000Z')},
		{start_date: new Date('2022-08-02T10:00:00.000Z'), end_date: new Date('2022-08-02T11:59:59.999Z'), date: new Date('2022-08-02T12:10:00.000Z')},
		{start_date: new Date('2022-08-02T12:00:00.000Z'), end_date: new Date('2022-08-02T13:59:59.999Z'), date: new Date('2022-08-02T14:10:00.000Z')},
		{start_date: new Date('2022-08-02T14:00:00.000Z'), end_date: new Date('2022-08-02T15:59:59.999Z'), date: new Date('2022-08-02T16:10:00.000Z')},
		{start_date: new Date('2022-08-02T16:00:00.000Z'), end_date: new Date('2022-08-02T17:59:59.999Z'), date: new Date('2022-08-02T18:10:00.000Z')},
		{start_date: new Date('2022-08-02T18:00:00.000Z'), end_date: new Date('2022-08-02T19:59:59.999Z'), date: new Date('2022-08-02T20:10:00.000Z')},
		{start_date: new Date('2022-08-02T20:00:00.000Z'), end_date: new Date('2022-08-02T21:59:59.999Z'), date: new Date('2022-08-02T22:10:00.000Z')},
		{start_date: new Date('2022-08-02T22:00:00.000Z'), end_date: new Date('2022-08-02T23:59:59.999Z'), date: new Date('2022-08-03T00:10:00.000Z')},

		{start_date: new Date('2022-08-03T00:00:00.000Z'), end_date: new Date('2022-08-03T01:59:59.999Z'), date: new Date('2022-08-03T02:10:00.000Z')},
		{start_date: new Date('2022-08-03T02:00:00.000Z'), end_date: new Date('2022-08-03T03:59:59.999Z'), date: new Date('2022-08-03T04:10:00.000Z')},
		{start_date: new Date('2022-08-03T04:00:00.000Z'), end_date: new Date('2022-08-03T05:59:59.999Z'), date: new Date('2022-08-03T06:10:00.000Z')},
		{start_date: new Date('2022-08-03T06:00:00.000Z'), end_date: new Date('2022-08-03T07:59:59.999Z'), date: new Date('2022-08-03T08:10:00.000Z')},
		{start_date: new Date('2022-08-03T08:00:00.000Z'), end_date: new Date('2022-08-03T09:59:59.999Z'), date: new Date('2022-08-03T10:10:00.000Z')},
		{start_date: new Date('2022-08-03T10:00:00.000Z'), end_date: new Date('2022-08-03T11:59:59.999Z'), date: new Date('2022-08-03T12:10:00.000Z')},
		{start_date: new Date('2022-08-03T12:00:00.000Z'), end_date: new Date('2022-08-03T13:59:59.999Z'), date: new Date('2022-08-03T14:10:00.000Z')},
		{start_date: new Date('2022-08-03T14:00:00.000Z'), end_date: new Date('2022-08-03T15:59:59.999Z'), date: new Date('2022-08-03T16:10:00.000Z')},
		{start_date: new Date('2022-08-03T16:00:00.000Z'), end_date: new Date('2022-08-03T17:59:59.999Z'), date: new Date('2022-08-03T18:10:00.000Z')},
		{start_date: new Date('2022-08-03T18:00:00.000Z'), end_date: new Date('2022-08-03T19:59:59.999Z'), date: new Date('2022-08-03T20:10:00.000Z')},
		{start_date: new Date('2022-08-03T20:00:00.000Z'), end_date: new Date('2022-08-03T21:59:59.999Z'), date: new Date('2022-08-03T22:10:00.000Z')},
		{start_date: new Date('2022-08-03T22:00:00.000Z'), end_date: new Date('2022-08-03T23:59:59.999Z'), date: new Date('2022-08-04T00:10:00.000Z')},

		{start_date: new Date('2022-08-04T00:00:00.000Z'), end_date: new Date('2022-08-04T01:59:59.999Z'), date: new Date('2022-08-04T02:10:00.000Z')},
		{start_date: new Date('2022-08-04T02:00:00.000Z'), end_date: new Date('2022-08-04T03:59:59.999Z'), date: new Date('2022-08-04T04:10:00.000Z')},
		{start_date: new Date('2022-08-04T04:00:00.000Z'), end_date: new Date('2022-08-04T05:59:59.999Z'), date: new Date('2022-08-04T06:10:00.000Z')},
		{start_date: new Date('2022-08-04T06:00:00.000Z'), end_date: new Date('2022-08-04T07:59:59.999Z'), date: new Date('2022-08-04T08:10:00.000Z')},
		{start_date: new Date('2022-08-04T08:00:00.000Z'), end_date: new Date('2022-08-04T09:59:59.999Z'), date: new Date('2022-08-04T10:10:00.000Z')},
		{start_date: new Date('2022-08-04T10:00:00.000Z'), end_date: new Date('2022-08-04T11:59:59.999Z'), date: new Date('2022-08-04T12:10:00.000Z')},
		{start_date: new Date('2022-08-04T12:00:00.000Z'), end_date: new Date('2022-08-04T13:59:59.999Z'), date: new Date('2022-08-04T14:10:00.000Z')},
		{start_date: new Date('2022-08-04T14:00:00.000Z'), end_date: new Date('2022-08-04T15:59:59.999Z'), date: new Date('2022-08-04T16:10:00.000Z')},
		{start_date: new Date('2022-08-04T16:00:00.000Z'), end_date: new Date('2022-08-04T17:59:59.999Z'), date: new Date('2022-08-04T18:10:00.000Z')},
		{start_date: new Date('2022-08-04T18:00:00.000Z'), end_date: new Date('2022-08-04T19:59:59.999Z'), date: new Date('2022-08-04T20:10:00.000Z')},
		{start_date: new Date('2022-08-04T20:00:00.000Z'), end_date: new Date('2022-08-04T21:59:59.999Z'), date: new Date('2022-08-04T22:10:00.000Z')},
		{start_date: new Date('2022-08-04T22:00:00.000Z'), end_date: new Date('2022-08-04T23:59:59.999Z'), date: new Date('2022-08-05T00:10:00.000Z')},

		{start_date: new Date('2022-08-04T00:00:00.000Z'), end_date: new Date('2022-08-04T03:59:59.999Z'), date: new Date('2022-08-04T04:10:00.000Z')},
		{start_date: new Date('2022-08-04T04:00:00.000Z'), end_date: new Date('2022-08-04T07:59:59.999Z'), date: new Date('2022-08-04T08:10:00.000Z')},
		{start_date: new Date('2022-08-04T08:00:00.000Z'), end_date: new Date('2022-08-04T11:59:59.999Z'), date: new Date('2022-08-04T12:10:00.000Z')},
		{start_date: new Date('2022-08-04T12:00:00.000Z'), end_date: new Date('2022-08-04T15:59:59.999Z'), date: new Date('2022-08-04T16:10:00.000Z')},
		{start_date: new Date('2022-08-04T16:00:00.000Z'), end_date: new Date('2022-08-04T19:59:59.999Z'), date: new Date('2022-08-04T20:10:00.000Z')},
		{start_date: new Date('2022-08-04T20:00:00.000Z'), end_date: new Date('2022-08-04T23:59:59.999Z'), date: new Date('2022-08-05T00:10:00.000Z')},

		{start_date: new Date('2022-08-05T00:00:00.000Z'), end_date: new Date('2022-08-05T03:59:59.999Z'), date: new Date('2022-08-05T04:10:00.000Z')},
		{start_date: new Date('2022-08-05T04:00:00.000Z'), end_date: new Date('2022-08-05T07:59:59.999Z'), date: new Date('2022-08-05T08:10:00.000Z')},
		{start_date: new Date('2022-08-05T08:00:00.000Z'), end_date: new Date('2022-08-05T11:59:59.999Z'), date: new Date('2022-08-05T12:10:00.000Z')},
		{start_date: new Date('2022-08-05T12:00:00.000Z'), end_date: new Date('2022-08-05T15:59:59.999Z'), date: new Date('2022-08-05T16:10:00.000Z')},
		{start_date: new Date('2022-08-05T16:00:00.000Z'), end_date: new Date('2022-08-05T19:59:59.999Z'), date: new Date('2022-08-05T20:10:00.000Z')},
		{start_date: new Date('2022-08-05T20:00:00.000Z'), end_date: new Date('2022-08-05T23:59:59.999Z'), date: new Date('2022-08-06T00:10:00.000Z')},

		{start_date: new Date('2022-08-06T00:00:00.000Z'), end_date: new Date('2022-08-06T03:59:59.999Z'), date: new Date('2022-08-06T04:10:00.000Z')},
		{start_date: new Date('2022-08-06T04:00:00.000Z'), end_date: new Date('2022-08-06T07:59:59.999Z'), date: new Date('2022-08-06T08:10:00.000Z')},
		{start_date: new Date('2022-08-06T08:00:00.000Z'), end_date: new Date('2022-08-06T11:59:59.999Z'), date: new Date('2022-08-06T12:10:00.000Z')},
		{start_date: new Date('2022-08-06T12:00:00.000Z'), end_date: new Date('2022-08-06T15:59:59.999Z'), date: new Date('2022-08-06T16:10:00.000Z')},
		{start_date: new Date('2022-08-06T16:00:00.000Z'), end_date: new Date('2022-08-06T19:59:59.999Z'), date: new Date('2022-08-06T20:10:00.000Z')},
		{start_date: new Date('2022-08-06T20:00:00.000Z'), end_date: new Date('2022-08-06T23:59:59.999Z'), date: new Date('2022-08-07T00:10:00.000Z')},

		{start_date: new Date('2022-08-07T00:00:00.000Z'), end_date: new Date('2022-08-07T03:59:59.999Z'), date: new Date('2022-08-07T04:10:00.000Z')},
		{start_date: new Date('2022-08-07T04:00:00.000Z'), end_date: new Date('2022-08-07T07:59:59.999Z'), date: new Date('2022-08-07T08:10:00.000Z')},
		{start_date: new Date('2022-08-07T08:00:00.000Z'), end_date: new Date('2022-08-07T11:59:59.999Z'), date: new Date('2022-08-07T12:10:00.000Z')},
		{start_date: new Date('2022-08-07T12:00:00.000Z'), end_date: new Date('2022-08-07T15:59:59.999Z'), date: new Date('2022-08-07T16:10:00.000Z')},
		{start_date: new Date('2022-08-07T16:00:00.000Z'), end_date: new Date('2022-08-07T19:59:59.999Z'), date: new Date('2022-08-07T20:10:00.000Z')},
		{start_date: new Date('2022-08-07T20:00:00.000Z'), end_date: new Date('2022-08-07T23:59:59.999Z'), date: new Date('2022-08-08T00:10:00.000Z')},

		{start_date: new Date('2022-08-08T00:00:00.000Z'), end_date: new Date('2022-08-08T03:59:59.999Z'), date: new Date('2022-08-08T04:10:00.000Z')},
		{start_date: new Date('2022-08-08T04:00:00.000Z'), end_date: new Date('2022-08-08T07:59:59.999Z'), date: new Date('2022-08-08T08:10:00.000Z')},
		{start_date: new Date('2022-08-08T08:00:00.000Z'), end_date: new Date('2022-08-08T11:59:59.999Z'), date: new Date('2022-08-08T12:10:00.000Z')},
		{start_date: new Date('2022-08-08T12:00:00.000Z'), end_date: new Date('2022-08-08T15:59:59.999Z'), date: new Date('2022-08-08T16:10:00.000Z')},
		{start_date: new Date('2022-08-08T16:00:00.000Z'), end_date: new Date('2022-08-08T19:59:59.999Z'), date: new Date('2022-08-08T20:10:00.000Z')},
		{start_date: new Date('2022-08-08T20:00:00.000Z'), end_date: new Date('2022-08-08T23:59:59.999Z'), date: new Date('2022-08-09T00:10:00.000Z')},
	];

	Settlement.insertMany(docs, (results) => {
		console.log('docs:',results)

		database.close();
	});
});
