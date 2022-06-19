const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	receiver_name: {type: String},
	currency: {type: String},
	settlement_date: {type: Date, required: true},
	settlement_name: {type: String, required: true},
	settlement_status: {type: String, default: 'waiting'}, // waiting | done
	amount: {type: Number},
	fee: {type: Number},
	date: {type: Date},
	type: {type: String}, // CLTR_SET | PAYMENT | REMIT | WITHDRAWAL | REPAYMENT
	products: {type: Array},
	status: {type: String}, // init | cancel | paid | expired
	amount: {type: Number},
	items: [{
		name: {type: String},
		option: {type: String},
		price: {type: String},
		quantity: {type: Number},
		amount: {type: Number},
	}],
});

module.exports = mongoose.model('Transfer', dataSchema);
