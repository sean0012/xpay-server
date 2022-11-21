const account = require('./account');
const transfer = require('./transfer');
const settlement = require('./settlement');
const ledger = require('./ledger');
const collateral = require('./collateral');
const marketPrice = require('./market_price');

const setRoutes = (app) => {
	app.use('/api/v1/account', account);
	app.use('/api/v1/trade', transfer);
	app.use('/api/v1/settlement', settlement);
	app.use('/api/v1/banking', ledger);
	app.use('/api/v1/cltr', collateral);
	app.use('/api/v1/market_price', marketPrice);
	app.use((req, res, next) => {
		res.status(404).json({
			error: {
				code: 'NOT_FOUND',
				message: 'Resource not found'
			}
		});
	});
};

module.exports = {
	setRoutes: setRoutes
};
