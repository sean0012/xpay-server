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
		{start_date: new Date('2022-07-31T00:00:00.000Z'), end_date: new Date('2022-07-31T01:59:59.999Z'), date: new Date('2022-07-31T02:10:00.000Z')},
		{start_date: new Date('2022-07-31T02:00:00.000Z'), end_date: new Date('2022-07-31T03:59:59.999Z'), date: new Date('2022-07-31T04:10:00.000Z')},
		{start_date: new Date('2022-07-31T04:00:00.000Z'), end_date: new Date('2022-07-31T05:59:59.999Z'), date: new Date('2022-07-31T06:10:00.000Z')},
		{start_date: new Date('2022-07-31T06:00:00.000Z'), end_date: new Date('2022-07-31T07:59:59.999Z'), date: new Date('2022-07-31T08:10:00.000Z')},
		{start_date: new Date('2022-07-31T08:00:00.000Z'), end_date: new Date('2022-07-31T09:59:59.999Z'), date: new Date('2022-07-31T10:10:00.000Z')},
		{start_date: new Date('2022-07-31T10:00:00.000Z'), end_date: new Date('2022-07-31T11:59:59.999Z'), date: new Date('2022-07-31T12:10:00.000Z')},
		{start_date: new Date('2022-07-31T12:00:00.000Z'), end_date: new Date('2022-07-31T13:59:59.999Z'), date: new Date('2022-07-31T14:10:00.000Z')},
		{start_date: new Date('2022-07-31T14:00:00.000Z'), end_date: new Date('2022-07-31T15:59:59.999Z'), date: new Date('2022-07-31T16:10:00.000Z')},
		{start_date: new Date('2022-07-31T16:00:00.000Z'), end_date: new Date('2022-07-31T17:59:59.999Z'), date: new Date('2022-07-31T18:10:00.000Z')},
		{start_date: new Date('2022-07-31T18:00:00.000Z'), end_date: new Date('2022-07-31T19:59:59.999Z'), date: new Date('2022-07-31T20:10:00.000Z')},
		{start_date: new Date('2022-07-31T20:00:00.000Z'), end_date: new Date('2022-07-31T21:59:59.999Z'), date: new Date('2022-07-31T22:10:00.000Z')},
		{start_date: new Date('2022-07-31T22:00:00.000Z'), end_date: new Date('2022-07-31T23:59:59.999Z'), date: new Date('2022-08-01T00:10:00.000Z')},

		{start_date: new Date('2022-08-01T00:00:00.000Z'), end_date: new Date('2022-08-01T01:59:59.999Z'), date: new Date('2022-08-01T02:10:00.000Z')},
		{start_date: new Date('2022-08-01T02:00:00.000Z'), end_date: new Date('2022-08-01T03:59:59.999Z'), date: new Date('2022-08-01T04:10:00.000Z')},
		{start_date: new Date('2022-08-01T04:00:00.000Z'), end_date: new Date('2022-08-01T05:59:59.999Z'), date: new Date('2022-08-01T06:10:00.000Z')},
		{start_date: new Date('2022-08-01T06:00:00.000Z'), end_date: new Date('2022-08-01T07:59:59.999Z'), date: new Date('2022-08-01T08:10:00.000Z')},
		{start_date: new Date('2022-08-01T08:00:00.000Z'), end_date: new Date('2022-08-01T09:59:59.999Z'), date: new Date('2022-08-01T10:10:00.000Z')},
		{start_date: new Date('2022-08-01T10:00:00.000Z'), end_date: new Date('2022-08-01T11:59:59.999Z'), date: new Date('2022-08-01T12:10:00.000Z')},
		{start_date: new Date('2022-08-01T12:00:00.000Z'), end_date: new Date('2022-08-01T13:59:59.999Z'), date: new Date('2022-08-01T14:10:00.000Z')},
		{start_date: new Date('2022-08-01T14:00:00.000Z'), end_date: new Date('2022-08-01T15:59:59.999Z'), date: new Date('2022-08-01T16:10:00.000Z')},
		{start_date: new Date('2022-08-01T16:00:00.000Z'), end_date: new Date('2022-08-01T17:59:59.999Z'), date: new Date('2022-08-01T18:10:00.000Z')},
		{start_date: new Date('2022-08-01T18:00:00.000Z'), end_date: new Date('2022-08-01T19:59:59.999Z'), date: new Date('2022-08-01T20:10:00.000Z')},
		{start_date: new Date('2022-08-01T20:00:00.000Z'), end_date: new Date('2022-08-01T21:59:59.999Z'), date: new Date('2022-08-01T22:10:00.000Z')},
		{start_date: new Date('2022-08-01T22:00:00.000Z'), end_date: new Date('2022-08-01T23:59:59.999Z'), date: new Date('2022-08-02T00:10:00.000Z')},

		// {start_date: new Date('2022-07-27T00:00:00.000Z'), end_date: new Date('2022-07-27T01:59:59.999Z'), date: new Date('2022-07-27T02:10:00.000Z')},
		// {start_date: new Date('2022-07-27T02:00:00.000Z'), end_date: new Date('2022-07-27T03:59:59.999Z'), date: new Date('2022-07-27T04:10:00.000Z')},
		// {start_date: new Date('2022-07-27T04:00:00.000Z'), end_date: new Date('2022-07-27T05:59:59.999Z'), date: new Date('2022-07-27T06:10:00.000Z')},
		// {start_date: new Date('2022-07-27T06:00:00.000Z'), end_date: new Date('2022-07-27T07:59:59.999Z'), date: new Date('2022-07-27T08:10:00.000Z')},
		// {start_date: new Date('2022-07-27T08:00:00.000Z'), end_date: new Date('2022-07-27T09:59:59.999Z'), date: new Date('2022-07-27T10:10:00.000Z')},
		// {start_date: new Date('2022-07-27T10:00:00.000Z'), end_date: new Date('2022-07-27T11:59:59.999Z'), date: new Date('2022-07-27T12:10:00.000Z')},
		// {start_date: new Date('2022-07-27T12:00:00.000Z'), end_date: new Date('2022-07-27T13:59:59.999Z'), date: new Date('2022-07-27T14:10:00.000Z')},
		// {start_date: new Date('2022-07-27T14:00:00.000Z'), end_date: new Date('2022-07-27T15:59:59.999Z'), date: new Date('2022-07-27T16:10:00.000Z')},
		// {start_date: new Date('2022-07-27T16:00:00.000Z'), end_date: new Date('2022-07-27T17:59:59.999Z'), date: new Date('2022-07-27T18:10:00.000Z')},
		// {start_date: new Date('2022-07-27T18:00:00.000Z'), end_date: new Date('2022-07-27T19:59:59.999Z'), date: new Date('2022-07-27T20:10:00.000Z')},
		// {start_date: new Date('2022-07-27T20:00:00.000Z'), end_date: new Date('2022-07-27T21:59:59.999Z'), date: new Date('2022-07-27T22:10:00.000Z')},
		// {start_date: new Date('2022-07-27T22:00:00.000Z'), end_date: new Date('2022-07-27T23:59:59.999Z'), date: new Date('2022-07-28T00:10:00.000Z')},

		// {start_date: new Date('2022-07-28T00:00:00.000Z'), end_date: new Date('2022-07-28T01:59:59.999Z'), date: new Date('2022-07-28T02:10:00.000Z')},
		// {start_date: new Date('2022-07-28T02:00:00.000Z'), end_date: new Date('2022-07-28T03:59:59.999Z'), date: new Date('2022-07-28T04:10:00.000Z')},
		// {start_date: new Date('2022-07-28T04:00:00.000Z'), end_date: new Date('2022-07-28T05:59:59.999Z'), date: new Date('2022-07-28T06:10:00.000Z')},
		// {start_date: new Date('2022-07-28T06:00:00.000Z'), end_date: new Date('2022-07-28T07:59:59.999Z'), date: new Date('2022-07-28T08:10:00.000Z')},
		// {start_date: new Date('2022-07-28T08:00:00.000Z'), end_date: new Date('2022-07-28T09:59:59.999Z'), date: new Date('2022-07-28T10:10:00.000Z')},
		// {start_date: new Date('2022-07-28T10:00:00.000Z'), end_date: new Date('2022-07-28T11:59:59.999Z'), date: new Date('2022-07-28T12:10:00.000Z')},
		// {start_date: new Date('2022-07-28T12:00:00.000Z'), end_date: new Date('2022-07-28T13:59:59.999Z'), date: new Date('2022-07-28T14:10:00.000Z')},
		// {start_date: new Date('2022-07-28T14:00:00.000Z'), end_date: new Date('2022-07-28T15:59:59.999Z'), date: new Date('2022-07-28T16:10:00.000Z')},
		// {start_date: new Date('2022-07-28T16:00:00.000Z'), end_date: new Date('2022-07-28T17:59:59.999Z'), date: new Date('2022-07-28T18:10:00.000Z')},
		// {start_date: new Date('2022-07-28T18:00:00.000Z'), end_date: new Date('2022-07-28T19:59:59.999Z'), date: new Date('2022-07-28T20:10:00.000Z')},
		// {start_date: new Date('2022-07-28T20:00:00.000Z'), end_date: new Date('2022-07-28T21:59:59.999Z'), date: new Date('2022-07-28T22:10:00.000Z')},
		// {start_date: new Date('2022-07-28T22:00:00.000Z'), end_date: new Date('2022-07-28T23:59:59.999Z'), date: new Date('2022-07-29T00:10:00.000Z')},

		// {start_date: new Date('2022-07-29T00:00:00.000Z'), end_date: new Date('2022-07-29T01:59:59.999Z'), date: new Date('2022-07-29T02:10:00.000Z')},
		// {start_date: new Date('2022-07-29T02:00:00.000Z'), end_date: new Date('2022-07-29T03:59:59.999Z'), date: new Date('2022-07-29T04:10:00.000Z')},
		// {start_date: new Date('2022-07-29T04:00:00.000Z'), end_date: new Date('2022-07-29T05:59:59.999Z'), date: new Date('2022-07-29T06:10:00.000Z')},
		// {start_date: new Date('2022-07-29T06:00:00.000Z'), end_date: new Date('2022-07-29T07:59:59.999Z'), date: new Date('2022-07-29T08:10:00.000Z')},
		// {start_date: new Date('2022-07-29T08:00:00.000Z'), end_date: new Date('2022-07-29T09:59:59.999Z'), date: new Date('2022-07-29T10:10:00.000Z')},
		// {start_date: new Date('2022-07-29T10:00:00.000Z'), end_date: new Date('2022-07-29T11:59:59.999Z'), date: new Date('2022-07-29T12:10:00.000Z')},
		// {start_date: new Date('2022-07-29T12:00:00.000Z'), end_date: new Date('2022-07-29T13:59:59.999Z'), date: new Date('2022-07-29T14:10:00.000Z')},
		// {start_date: new Date('2022-07-29T14:00:00.000Z'), end_date: new Date('2022-07-29T15:59:59.999Z'), date: new Date('2022-07-29T16:10:00.000Z')},
		// {start_date: new Date('2022-07-29T16:00:00.000Z'), end_date: new Date('2022-07-29T17:59:59.999Z'), date: new Date('2022-07-29T18:10:00.000Z')},
		// {start_date: new Date('2022-07-29T18:00:00.000Z'), end_date: new Date('2022-07-29T19:59:59.999Z'), date: new Date('2022-07-29T20:10:00.000Z')},
		// {start_date: new Date('2022-07-29T20:00:00.000Z'), end_date: new Date('2022-07-29T21:59:59.999Z'), date: new Date('2022-07-29T22:10:00.000Z')},
		// {start_date: new Date('2022-07-29T22:00:00.000Z'), end_date: new Date('2022-07-29T23:59:59.999Z'), date: new Date('2022-07-30T00:10:00.000Z')},

		// {start_date: new Date('2022-07-30T00:00:00.000Z'), end_date: new Date('2022-07-30T01:59:59.999Z'), date: new Date('2022-07-30T02:10:00.000Z')},
		// {start_date: new Date('2022-07-30T02:00:00.000Z'), end_date: new Date('2022-07-30T03:59:59.999Z'), date: new Date('2022-07-30T04:10:00.000Z')},
		// {start_date: new Date('2022-07-30T04:00:00.000Z'), end_date: new Date('2022-07-30T05:59:59.999Z'), date: new Date('2022-07-30T06:10:00.000Z')},
		// {start_date: new Date('2022-07-30T06:00:00.000Z'), end_date: new Date('2022-07-30T07:59:59.999Z'), date: new Date('2022-07-30T08:10:00.000Z')},
		// {start_date: new Date('2022-07-30T08:00:00.000Z'), end_date: new Date('2022-07-30T09:59:59.999Z'), date: new Date('2022-07-30T10:10:00.000Z')},
		// {start_date: new Date('2022-07-30T10:00:00.000Z'), end_date: new Date('2022-07-30T11:59:59.999Z'), date: new Date('2022-07-30T12:10:00.000Z')},
		// {start_date: new Date('2022-07-30T12:00:00.000Z'), end_date: new Date('2022-07-30T13:59:59.999Z'), date: new Date('2022-07-30T14:10:00.000Z')},
		// {start_date: new Date('2022-07-30T14:00:00.000Z'), end_date: new Date('2022-07-30T15:59:59.999Z'), date: new Date('2022-07-30T16:10:00.000Z')},
		// {start_date: new Date('2022-07-30T16:00:00.000Z'), end_date: new Date('2022-07-30T17:59:59.999Z'), date: new Date('2022-07-30T18:10:00.000Z')},
		// {start_date: new Date('2022-07-30T18:00:00.000Z'), end_date: new Date('2022-07-30T19:59:59.999Z'), date: new Date('2022-07-30T20:10:00.000Z')},
		// {start_date: new Date('2022-07-30T20:00:00.000Z'), end_date: new Date('2022-07-30T21:59:59.999Z'), date: new Date('2022-07-30T22:10:00.000Z')},
		// {start_date: new Date('2022-07-30T22:00:00.000Z'), end_date: new Date('2022-07-30T23:59:59.999Z'), date: new Date('2022-07-31T00:10:00.000Z')},
	];

	Settlement.insertMany(docs, (error, results) => {
		console.log('error:',error)
		console.log('docs:',results)

		database.close();
	});
});
