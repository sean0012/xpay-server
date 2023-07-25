const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	card_number: {type: String},
	holder: {type: String},
	cvv: {type: String},
	date: {type: String},
}, { timestamps: true });

module.exports = mongoose.model('Card', dataSchema);
