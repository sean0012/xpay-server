const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	bank_account: {required: true, type: String},
	used: {required: true, type: Boolean, default: false},
}, { timestamps: true });

module.exports = mongoose.model('virtual_accounts', dataSchema);
