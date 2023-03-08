const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	sender_wallet: {type: String},
	receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_wallet: {type: String},
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
	category: {type: String}, // Account.business_category
	type: {type: String}, // CLTR_SET | PAYMENT | REMIT | WITHDRAWAL | REPAYMENT
	status: {type: String}, // INIT | CANCELED | PAID | DYNA
	approval_id: {type: String, required: false}, // 9 digits number
	payer_points_using: {type: Number},
	payer_points_gained: {type: Number},
	memo: {type: String, maxLength: 256},
	payer_signature: {type: String, maxLength: 256},
	payment_time: {type: Date},
	shop_return_url: {type: String},
	shop_order_id: {type: String},
	shop_data: {type: String},
}, { timestamps: true });

module.exports = mongoose.model('Transfer', dataSchema);
