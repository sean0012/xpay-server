require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const passport = require('passport');
const Strategy = require('passport-http-bearer').Strategy;
const routes = require('./routes');
const Account = require('./models/account');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');
});

const app = express();

passport.use(new Strategy(async (token, cb) => {
	const account = await Account.findOne({auth_token: token}).exec();

	if (!account) {
		console.log('No account');
		return cb(null, false);
	} else {
		console.log('Account success!');
		return cb(null, account);
	}
}));


app.use(express.json());
routes.setRoutes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server Started at port ${port}`)
});
