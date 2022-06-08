const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	currency: {type: String},
	sender: {type: String},
	receiver: {type: String},
	amount: {type: Number},
	fee: {type: Number},
	type: {type: String},
	date: {type: Date},
});

module.exports = mongoose.model('Settlement', dataSchema);
