const INTERVAL = 10 * 60 * 1000 // 10 min

const Account = require('../models/account');
const Transfer = require('../models/transfer');
const Settlement = require('../models/settlement');

const check = async () => {
	const thisSettlement = await Settlement.findOne({done: false}).sort('date').exec();
	const timestamp = new Date();
	console.log('this:',thisSettlement.date, timestamp)

	if (timestamp > thisSettlement.date) {
		console.log('Process Settlement');
		thisSettlement.done = true;
		await thisSettlement.save();

		const paidTransfers = await Transfer.find({
			status: 'PAID',
			settlement_id: thisSettlement._id,
		}).lean();

		console.log('count:',paidTransfers.length);
		const receiverObject = {};
		paidTransfers.map(t => {
			if (t.receiver_id in receiverObject) {

			} else {
				receiverObject[t.receiver_id] = [];
			}
			receiverObject[t.receiver_id].push({
				amount: t.amount,
				payer_points_gained:t.payer_points_gained,
			});
		});
		console.log('receiverObject:',receiverObject);

		for (const id in receiverObject) {
			const receiver = receiverObject[id];
			let amountSum = 0;
			let pointSum = 0;
			receiver.forEach(r => {
				amountSum += r.amount;
				pointSum += r.payer_points_gained;
			});
			const merchant = await Account.findOneAndUpdate(
				{_id: id},
				{
					$inc: { withdrawable: amountSum + pointSum},
					points: 0,
				}
			).exec();
		}
	}

	setTimeout(check, INTERVAL)
};

module.exports = { check };
