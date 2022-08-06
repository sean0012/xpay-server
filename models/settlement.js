const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	start_date: {type: Date, required: true, unique: true},
	end_date: {type: Date, required: true, unique: true},
	date: {type: Date, required: true},
	done: {type: Boolean, default: false},
});

module.exports = mongoose.model('Settlement', dataSchema);
