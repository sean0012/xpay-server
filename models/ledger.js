const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	amount: {type: Number, required: false},
	title: {type: String, required: false},
	banking: {
		name: {type: String},
		amount: {type: Number},
		datetime: {type: String},
		timestamp: {type: Date},
		bank_name: {type: String},
		bank_account: {type: String},
		printed_content: {type: String},
		deposit_type: {type: String},
	},
	account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},

}, { timestamps: true });

module.exports = mongoose.model('Ledger', dataSchema);
