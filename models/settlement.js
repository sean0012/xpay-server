const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	currency: {type: String},
	date: {type: Date},
	display_name: {type: String},
	settled: {type: Boolean},
});

module.exports = mongoose.model('Settlement', dataSchema);
