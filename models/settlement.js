const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	start_date: {type: Date, unique: true},
	end_date: {type: Date, unique: true},
	date: {type: Date, unique: true},
	done: {type: Boolean, default: false},
});

module.exports = mongoose.model('Settlement', dataSchema);
