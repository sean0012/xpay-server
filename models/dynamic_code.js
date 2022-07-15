const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	code: {required: true, type: String},
	used: {required: true, type: Boolean, default: false},
}, { timestamps: true });

module.exports = mongoose.model('dynamic_code', dataSchema);
