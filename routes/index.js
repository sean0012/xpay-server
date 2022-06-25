const account = require('./account');
const transfer = require('./transfer');

const setRoutes = (app) => {
	app.use('/api/v1/account', account);
	app.use('/api/v1/transfer', transfer);
	app.use((req, res, next) => {
		res.status(404).json({
			error: {
				code: 'PAGE_NOT_FOUND',
				message: 'Requested page is not found'
			}
		});
	});
};

module.exports = {
	setRoutes: setRoutes
};
