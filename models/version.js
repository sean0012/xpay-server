const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	version: {required: false, type: String},
	version_min: {required: false, type: String},
});

module.exports = mongoose.model('Version', dataSchema);
