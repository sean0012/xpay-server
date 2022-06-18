const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	settlement_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Settlement'},
	receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_name: {type: String},
	currency: {type: String},
	amount: {type: Number},
	fee: {type: Number},
	date: {type: Date},
	type: {type: String}, // CLTR_SET | PAYMENT | REMIT | WITHDRAWAL | REPAYMENT
	products: {type: Array},
	canceled: {type: Boolean},
});

module.exports = mongoose.model('Transfer', dataSchema);
