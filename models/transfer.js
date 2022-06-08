const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	settlement_id: {type: Object},
	currency: {type: String},
	sender: {type: String},
	receiver: {type: String},
	amount: {type: Number},
	fee: {type: Number},
	type: {type: String},
	products: {type: Array},
});

module.exports = mongoose.model('Transfer', dataSchema);
