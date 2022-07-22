const INTERVAL = 1 * 5 * 1000 // 10 min

const Transfer = require('../models/transfer');

const check = async () => {
	console.log('check');
	const paidTransfers = await Transfer.find({status: 'PAID'}).lean();

	console.log('count:',paidTransfers.length);

	setTimeout(check, INTERVAL)
};

module.exports = { check };
