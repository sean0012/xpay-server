const INTERVAL = 60 * 60 * 1000; // 1 hour
const OLD = 1; // 1 day old

const moment = require('moment');
const Transfer = require('../models/transfer');
const Collateral = require('../models/collateral');

const check = async () => {
	const oldEnough = moment().subtract(OLD, 'days')
	console.log('deleter check', oldEnough);

	const deleteTransferResult = await Transfer.deleteMany({
		'$or': [{status: 'INIT'}, {status: 'DYNA'}],
		expiry: {'$lt': oldEnough}
	}).lean();
	const deleteCollateralResult = await Collateral.deleteMany({
		'$or': [{status: 'INIT'}, {status: 'DYNA'}],
		expiry: {'$lt': oldEnough}
	}).lean();

	console.log('deleteTransferResult:',deleteTransferResult);
	console.log('deleteCollateralResult:',deleteCollateralResult);

	setTimeout(check, INTERVAL);
};

module.exports = { check };
