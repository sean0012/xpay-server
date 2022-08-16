const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	amount: {type: Number, required: false},
	title: {type: String, required: false},
	banking: {
		name: {type: String},
		amount: {type: Number},
		datetime: {type: String},
		bank_name: {type: String},
		bank_account: {type: String},
		printed_content: {type: String},
	},
	account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
}, { timestamps: true });

module.exports = mongoose.model('Ledger', dataSchema);
