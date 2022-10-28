const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	collateral_name: {type: String, uppercase: true},
	collateral_amount: {type: Number},
	collateral_price: {type: Number},
	ex_market: {type: String, uppercase: true},
	offer_date: {type: Date},
	dynamic_code: {type: String, required: false},
	expiry: {type: Date},
	approval_id: {type: String},
	status: {type: String, uppercase: true}, // INIT | DONE
}, { timestamps: true });

module.exports = mongoose.model('Collaterals', dataSchema);
