const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	code: {required: true, type: String},
});

module.exports = mongoose.model('DynamicCode', dataSchema);
