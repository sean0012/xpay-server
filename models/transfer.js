const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_name: {type: String},
	receiver_address: {type: String},
	receiver_registration: {type: String},
	receiver_phone: {type: String},
	currency: {type: String},
	settlement: {
		date: {type: Date},
		done: {type: Boolean, default: false},
	},
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
	status: {type: String}, // INIT | CANCELED | PAID | EXPIRED
	approval_id: {type: String, required: false}, // 9 digits number
	payer_points_using: {type: Number},
	payer_points_gained: {type: Number},
	memo: {type: String, maxLength: 256},
	payer_signature: {type: String, maxLength: 256},
	payment_time: {type: Date},
}, { timestamps: true });

module.exports = mongoose.model('Transfer', dataSchema);
