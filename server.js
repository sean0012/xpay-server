require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const passport = require('passport');
const Strategy = require('passport-http-bearer').Strategy;
const requestIp = require('request-ip');
const routes = require('./routes');
const Account = require('./models/account');
const workerSettlement = require('./worker/settlement');
const workerMarketprice = require('./worker/marketprice');
const workerDeleter = require('./worker/deleter');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');
	// workerSettlement.check();
	// workerMarketprice.getMarketPrice('60');
	// workerMarketprice.getMarketPrice('1440');
	// workerDeleter.check();
});

const app = express();

passport.use(new Strategy(async (token, cb) => {
	const account = await Account.findOne({auth_token: token}).exec();

	if (!account) {
		return cb(null, false);
	} else {
		return cb(null, account);
	}
}));


app.use(cors());
app.use(express.json());
app.use(requestIp.mw());
routes.setRoutes(app);

app.set('view engine', 'ejs');
app.use(express.static('public')); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server Started at port ${port}`)
});
