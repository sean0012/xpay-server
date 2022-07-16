const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_name: {type: String},
	currency: {type: String},
	settlement_date: {type: Date, required: true},
	settlement_name: {type: String, required: true},
	settlement_status: {type: String, default: 'WAITING'}, // WAITING | DONE
	amount: {type: Number},
	items: [{
		name: {type: String},
		option: {type: String},
		price: {type: String},
		quantity: {type: Number},
	}],
	fee: {type: Number},
	dynamic_code: {type: String, required: false},
	expiry: {type: Date},
	type: {type: String}, // CLTR_SET | PAYMENT | REMIT | WITHDRAWAL | REPAYMENT
	status: {type: String}, // INIT | CANCEL | PAID | EXPIRED
	approval_id: {type: String, required: false}, // 9 digits number
	points_spent: {type: Number},
	points_gained: {type: Number},
	memo: {type: String, maxLength: 256},
	payer_signature: {type: String, maxLength: 256},
}, { timestamps: true });

module.exports = mongoose.model('Transfer', dataSchema);
