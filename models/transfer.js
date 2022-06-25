const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_name: {type: String},
	currency: {type: String},
	settlement_date: {type: Date, required: true},
	settlement_name: {type: String, required: true},
	settlement_status: {type: String, default: 'WAITING'}, // WAITING | DONE
	title: {type: String},
	amount: {type: Number},
	items: [{
		name: {type: String},
		option: {type: String},
		price: {type: String},
		quantity: {type: Number},
	}],
	fee: {type: Number},
	date: {type: Date},
	dynamic_code: {type: String, required: false},
	expiry: {type: Date},
	type: {type: String}, // CLTR_SET | PAYMENT | REMIT | WITHDRAWAL | REPAYMENT
	status: {type: String}, // INIT | CANCEL | PAID | EXPIRED
});

module.exports = mongoose.model('Transfer', dataSchema);
