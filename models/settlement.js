const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	date: {type: Date},
	name: {type: String},
	status: {type: String, default: 'WAITING'}, // WAITING | DONE
});

module.exports = mongoose.model('Settlement', dataSchema);
