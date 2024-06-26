const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	quote: {type: String},
	base: {type: String},
	timestamp: {type: Date},
	open: {type: String},
	high: {type: String},
	low: {type: String},
	close: {type: String},
	interval: {type: String},
	quote_volume: {type: String},
});

module.exports = mongoose.model('market_price', dataSchema);
