const INTERVAL = 10 * 60 * 1000; // 10 min

const Account = require('../models/account');
const Transfer = require('../models/transfer');
const Settlement = require('../models/settlement');

const check = async () => {
	const thisSettlement = await Settlement.findOne({done: false}).sort('date').exec();
	const timestamp = new Date();

	if (thisSettlement && timestamp > thisSettlement.date) {
		console.log('Process Settlement', new Date());
		thisSettlement.done = true;
		const savedSettlement = await thisSettlement.save();
		console.log('saved settlement:', savedSettlement);

		const paidTransfers = await Transfer.find({
			status: 'PAID',
			'settlement.done': false,
			'settlement.date': thisSettlement.date,
		}).lean();

		const updatedTransfers = await Transfer.updateMany({
			status: 'PAID',
			'settlement.done': false,
			'settlement.date': thisSettlement.date,
		}, { 'settlement.done': true });

		console.log('paidTransfers:',paidTransfers.length);
		console.log('updated:', updatedTransfers.matchedCount, updatedTransfers.modifiedCount, updatedTransfers.acknowledged);

		const receiverObject = {};
		const payers = new Set();
		paidTransfers.map(t => {
			if (t.receiver_id) {
				payers.add(t.sender_id);
				if (t.receiver_id in receiverObject) {

				} else {
					receiverObject[t.receiver_id] = [];
				}

				const payerPointsGained = t.payer_points_gained ? t.payer_points_gained : 0;
				const transferAmount = t.amount ? t.amount : 0;

				receiverObject[t.receiver_id].push({
					amount: transferAmount,
					payer_points_gained: payerPointsGained,
				});
			}
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
				{ _id: id },
				{
					$inc: { withdrawable: amountSum + pointSum },
					points: 0,
				}
			).exec();

			if (!merchant) {
				console.error('Account update failed:', id, merchant);
			}
		}

		for (const payer of payers) {
			const payerAccount = await Account.findOne({_id: payer._id}).exec();
			payerAccount.deposit = payerAccount.deposit - payerAccount.payment_thismonth;
			payerAccount.payment_thismonth = payerAccount.payment_nextmonth;
			payerAccount.payment_nextmonth = 0;
			await payerAccount.save();
		}
	}

	setTimeout(check, INTERVAL)
};

module.exports = { check };
