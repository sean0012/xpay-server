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
		{start_date: new Date('2022-07-25T00:00:00.000Z'), end_date: new Date('2022-07-25T01:59:59.999Z'), date: new Date('2022-07-25T02:10:00.000Z')},
		{start_date: new Date('2022-07-25T02:00:00.000Z'), end_date: new Date('2022-07-25T03:59:59.999Z'), date: new Date('2022-07-25T04:10:00.000Z')},
		{start_date: new Date('2022-07-25T04:00:00.000Z'), end_date: new Date('2022-07-25T05:59:59.999Z'), date: new Date('2022-07-25T06:10:00.000Z')},
		{start_date: new Date('2022-07-25T06:00:00.000Z'), end_date: new Date('2022-07-25T07:59:59.999Z'), date: new Date('2022-07-25T08:10:00.000Z')},
		{start_date: new Date('2022-07-25T08:00:00.000Z'), end_date: new Date('2022-07-25T09:59:59.999Z'), date: new Date('2022-07-25T10:10:00.000Z')},
		{start_date: new Date('2022-07-25T10:00:00.000Z'), end_date: new Date('2022-07-25T11:59:59.999Z'), date: new Date('2022-07-25T12:10:00.000Z')},
		{start_date: new Date('2022-07-25T12:00:00.000Z'), end_date: new Date('2022-07-25T13:59:59.999Z'), date: new Date('2022-07-25T14:10:00.000Z')},
		{start_date: new Date('2022-07-25T14:00:00.000Z'), end_date: new Date('2022-07-25T15:59:59.999Z'), date: new Date('2022-07-25T16:10:00.000Z')},
		{start_date: new Date('2022-07-25T16:00:00.000Z'), end_date: new Date('2022-07-25T17:59:59.999Z'), date: new Date('2022-07-25T18:10:00.000Z')},
		{start_date: new Date('2022-07-25T18:00:00.000Z'), end_date: new Date('2022-07-25T19:59:59.999Z'), date: new Date('2022-07-25T20:10:00.000Z')},
		{start_date: new Date('2022-07-25T20:00:00.000Z'), end_date: new Date('2022-07-25T21:59:59.999Z'), date: new Date('2022-07-25T22:10:00.000Z')},
		{start_date: new Date('2022-07-25T22:00:00.000Z'), end_date: new Date('2022-07-25T23:59:59.999Z'), date: new Date('2022-07-26T00:10:00.000Z')},

		{start_date: new Date('2022-07-26T00:00:00.000Z'), end_date: new Date('2022-07-26T01:59:59.999Z'), date: new Date('2022-07-26T02:10:00.000Z')},
		{start_date: new Date('2022-07-26T02:00:00.000Z'), end_date: new Date('2022-07-26T03:59:59.999Z'), date: new Date('2022-07-26T04:10:00.000Z')},
		{start_date: new Date('2022-07-26T04:00:00.000Z'), end_date: new Date('2022-07-26T05:59:59.999Z'), date: new Date('2022-07-26T06:10:00.000Z')},
		{start_date: new Date('2022-07-26T06:00:00.000Z'), end_date: new Date('2022-07-26T07:59:59.999Z'), date: new Date('2022-07-26T08:10:00.000Z')},
		{start_date: new Date('2022-07-26T08:00:00.000Z'), end_date: new Date('2022-07-26T09:59:59.999Z'), date: new Date('2022-07-26T10:10:00.000Z')},
		{start_date: new Date('2022-07-26T10:00:00.000Z'), end_date: new Date('2022-07-26T11:59:59.999Z'), date: new Date('2022-07-26T12:10:00.000Z')},
		{start_date: new Date('2022-07-26T12:00:00.000Z'), end_date: new Date('2022-07-26T13:59:59.999Z'), date: new Date('2022-07-26T14:10:00.000Z')},
		{start_date: new Date('2022-07-26T14:00:00.000Z'), end_date: new Date('2022-07-26T15:59:59.999Z'), date: new Date('2022-07-26T16:10:00.000Z')},
		{start_date: new Date('2022-07-26T16:00:00.000Z'), end_date: new Date('2022-07-26T17:59:59.999Z'), date: new Date('2022-07-26T18:10:00.000Z')},
		{start_date: new Date('2022-07-26T18:00:00.000Z'), end_date: new Date('2022-07-26T19:59:59.999Z'), date: new Date('2022-07-26T20:10:00.000Z')},
		{start_date: new Date('2022-07-26T20:00:00.000Z'), end_date: new Date('2022-07-26T21:59:59.999Z'), date: new Date('2022-07-26T22:10:00.000Z')},
		{start_date: new Date('2022-07-26T22:00:00.000Z'), end_date: new Date('2022-07-26T23:59:59.999Z'), date: new Date('2022-07-27T00:10:00.000Z')},

		{start_date: new Date('2022-07-27T00:00:00.000Z'), end_date: new Date('2022-07-27T01:59:59.999Z'), date: new Date('2022-07-27T02:10:00.000Z')},
		{start_date: new Date('2022-07-27T02:00:00.000Z'), end_date: new Date('2022-07-27T03:59:59.999Z'), date: new Date('2022-07-27T04:10:00.000Z')},
		{start_date: new Date('2022-07-27T04:00:00.000Z'), end_date: new Date('2022-07-27T05:59:59.999Z'), date: new Date('2022-07-27T06:10:00.000Z')},
		{start_date: new Date('2022-07-27T06:00:00.000Z'), end_date: new Date('2022-07-27T07:59:59.999Z'), date: new Date('2022-07-27T08:10:00.000Z')},
		{start_date: new Date('2022-07-27T08:00:00.000Z'), end_date: new Date('2022-07-27T09:59:59.999Z'), date: new Date('2022-07-27T10:10:00.000Z')},
		{start_date: new Date('2022-07-27T10:00:00.000Z'), end_date: new Date('2022-07-27T11:59:59.999Z'), date: new Date('2022-07-27T12:10:00.000Z')},
		{start_date: new Date('2022-07-27T12:00:00.000Z'), end_date: new Date('2022-07-27T13:59:59.999Z'), date: new Date('2022-07-27T14:10:00.000Z')},
		{start_date: new Date('2022-07-27T14:00:00.000Z'), end_date: new Date('2022-07-27T15:59:59.999Z'), date: new Date('2022-07-27T16:10:00.000Z')},
		{start_date: new Date('2022-07-27T16:00:00.000Z'), end_date: new Date('2022-07-27T17:59:59.999Z'), date: new Date('2022-07-27T18:10:00.000Z')},
		{start_date: new Date('2022-07-27T18:00:00.000Z'), end_date: new Date('2022-07-27T19:59:59.999Z'), date: new Date('2022-07-27T20:10:00.000Z')},
		{start_date: new Date('2022-07-27T20:00:00.000Z'), end_date: new Date('2022-07-27T21:59:59.999Z'), date: new Date('2022-07-27T22:10:00.000Z')},
		{start_date: new Date('2022-07-27T22:00:00.000Z'), end_date: new Date('2022-07-27T23:59:59.999Z'), date: new Date('2022-07-28T00:10:00.000Z')},

		{start_date: new Date('2022-07-28T00:00:00.000Z'), end_date: new Date('2022-07-28T01:59:59.999Z'), date: new Date('2022-07-28T02:10:00.000Z')},
		{start_date: new Date('2022-07-28T02:00:00.000Z'), end_date: new Date('2022-07-28T03:59:59.999Z'), date: new Date('2022-07-28T04:10:00.000Z')},
		{start_date: new Date('2022-07-28T04:00:00.000Z'), end_date: new Date('2022-07-28T05:59:59.999Z'), date: new Date('2022-07-28T06:10:00.000Z')},
		{start_date: new Date('2022-07-28T06:00:00.000Z'), end_date: new Date('2022-07-28T07:59:59.999Z'), date: new Date('2022-07-28T08:10:00.000Z')},
		{start_date: new Date('2022-07-28T08:00:00.000Z'), end_date: new Date('2022-07-28T09:59:59.999Z'), date: new Date('2022-07-28T10:10:00.000Z')},
		{start_date: new Date('2022-07-28T10:00:00.000Z'), end_date: new Date('2022-07-28T11:59:59.999Z'), date: new Date('2022-07-28T12:10:00.000Z')},
		{start_date: new Date('2022-07-28T12:00:00.000Z'), end_date: new Date('2022-07-28T13:59:59.999Z'), date: new Date('2022-07-28T14:10:00.000Z')},
		{start_date: new Date('2022-07-28T14:00:00.000Z'), end_date: new Date('2022-07-28T15:59:59.999Z'), date: new Date('2022-07-28T16:10:00.000Z')},
		{start_date: new Date('2022-07-28T16:00:00.000Z'), end_date: new Date('2022-07-28T17:59:59.999Z'), date: new Date('2022-07-28T18:10:00.000Z')},
		{start_date: new Date('2022-07-28T18:00:00.000Z'), end_date: new Date('2022-07-28T19:59:59.999Z'), date: new Date('2022-07-28T20:10:00.000Z')},
		{start_date: new Date('2022-07-28T20:00:00.000Z'), end_date: new Date('2022-07-28T21:59:59.999Z'), date: new Date('2022-07-28T22:10:00.000Z')},
		{start_date: new Date('2022-07-28T22:00:00.000Z'), end_date: new Date('2022-07-28T23:59:59.999Z'), date: new Date('2022-07-29T00:10:00.000Z')},

		{start_date: new Date('2022-07-29T00:00:00.000Z'), end_date: new Date('2022-07-29T01:59:59.999Z'), date: new Date('2022-07-29T02:10:00.000Z')},
		{start_date: new Date('2022-07-29T02:00:00.000Z'), end_date: new Date('2022-07-29T03:59:59.999Z'), date: new Date('2022-07-29T04:10:00.000Z')},
		{start_date: new Date('2022-07-29T04:00:00.000Z'), end_date: new Date('2022-07-29T05:59:59.999Z'), date: new Date('2022-07-29T06:10:00.000Z')},
		{start_date: new Date('2022-07-29T06:00:00.000Z'), end_date: new Date('2022-07-29T07:59:59.999Z'), date: new Date('2022-07-29T08:10:00.000Z')},
		{start_date: new Date('2022-07-29T08:00:00.000Z'), end_date: new Date('2022-07-29T09:59:59.999Z'), date: new Date('2022-07-29T10:10:00.000Z')},
		{start_date: new Date('2022-07-29T10:00:00.000Z'), end_date: new Date('2022-07-29T11:59:59.999Z'), date: new Date('2022-07-29T12:10:00.000Z')},
		{start_date: new Date('2022-07-29T12:00:00.000Z'), end_date: new Date('2022-07-29T13:59:59.999Z'), date: new Date('2022-07-29T14:10:00.000Z')},
		{start_date: new Date('2022-07-29T14:00:00.000Z'), end_date: new Date('2022-07-29T15:59:59.999Z'), date: new Date('2022-07-29T16:10:00.000Z')},
		{start_date: new Date('2022-07-29T16:00:00.000Z'), end_date: new Date('2022-07-29T17:59:59.999Z'), date: new Date('2022-07-29T18:10:00.000Z')},
		{start_date: new Date('2022-07-29T18:00:00.000Z'), end_date: new Date('2022-07-29T19:59:59.999Z'), date: new Date('2022-07-29T20:10:00.000Z')},
		{start_date: new Date('2022-07-29T20:00:00.000Z'), end_date: new Date('2022-07-29T21:59:59.999Z'), date: new Date('2022-07-29T22:10:00.000Z')},
		{start_date: new Date('2022-07-29T22:00:00.000Z'), end_date: new Date('2022-07-29T23:59:59.999Z'), date: new Date('2022-07-30T00:10:00.000Z')},

		{start_date: new Date('2022-07-30T00:00:00.000Z'), end_date: new Date('2022-07-30T01:59:59.999Z'), date: new Date('2022-07-30T02:10:00.000Z')},
		{start_date: new Date('2022-07-30T02:00:00.000Z'), end_date: new Date('2022-07-30T03:59:59.999Z'), date: new Date('2022-07-30T04:10:00.000Z')},
		{start_date: new Date('2022-07-30T04:00:00.000Z'), end_date: new Date('2022-07-30T05:59:59.999Z'), date: new Date('2022-07-30T06:10:00.000Z')},
		{start_date: new Date('2022-07-30T06:00:00.000Z'), end_date: new Date('2022-07-30T07:59:59.999Z'), date: new Date('2022-07-30T08:10:00.000Z')},
		{start_date: new Date('2022-07-30T08:00:00.000Z'), end_date: new Date('2022-07-30T09:59:59.999Z'), date: new Date('2022-07-30T10:10:00.000Z')},
		{start_date: new Date('2022-07-30T10:00:00.000Z'), end_date: new Date('2022-07-30T11:59:59.999Z'), date: new Date('2022-07-30T12:10:00.000Z')},
		{start_date: new Date('2022-07-30T12:00:00.000Z'), end_date: new Date('2022-07-30T13:59:59.999Z'), date: new Date('2022-07-30T14:10:00.000Z')},
		{start_date: new Date('2022-07-30T14:00:00.000Z'), end_date: new Date('2022-07-30T15:59:59.999Z'), date: new Date('2022-07-30T16:10:00.000Z')},
		{start_date: new Date('2022-07-30T16:00:00.000Z'), end_date: new Date('2022-07-30T17:59:59.999Z'), date: new Date('2022-07-30T18:10:00.000Z')},
		{start_date: new Date('2022-07-30T18:00:00.000Z'), end_date: new Date('2022-07-30T19:59:59.999Z'), date: new Date('2022-07-30T20:10:00.000Z')},
		{start_date: new Date('2022-07-30T20:00:00.000Z'), end_date: new Date('2022-07-30T21:59:59.999Z'), date: new Date('2022-07-30T22:10:00.000Z')},
		{start_date: new Date('2022-07-30T22:00:00.000Z'), end_date: new Date('2022-07-30T23:59:59.999Z'), date: new Date('2022-07-31T00:10:00.000Z')},
	];

	Settlement.insertMany(docs, (error, results) => {
		console.log('error:',error)
		console.log('docs:',results)

		database.close();
	});
});
