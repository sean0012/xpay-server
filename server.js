require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
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
	workerSettlement.check();
	workerMarketprice.getMarketPrice('60');
	workerMarketprice.getMarketPrice('1440');
	workerDeleter.check();
});

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestIp.mw());
app.use(express.static(path.join(__dirname, 'public')));
routes.setRoutes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server Started at port ${port}`)
});
