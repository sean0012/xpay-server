const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	wallet: {required: true, type: String},
	secret_hash: {required: true, type: String},
	auth_token: {required: true, type: String},
	collateral_name: {required: true, type: String},
	collateral_amount: {required: true, type: Number},
	collateral_price: {required: true, type: Number},
	collateral: {required: true, type: Number},
	collateral_balance: {required: true, type: Number},
	collateral_liquidation: {required: true, type: Number},
	token_name: {required: true, type: String},
	token_limit: {required: true, type: Number, default: 0},
	token_using: {required: true, type: Number, default: 0},
	token_balance: {required: true, type: Number, default: 0},
	withdrawable: {required: false, type: Number, default: 0},
	deposit: {required: false, type: Number},
	points: {required: false, type: Number},
	grade: {required: true, type: Number, default: 3}, // 회원등급 0~9 (0:사용불가, 1:사용중지, 3~정상)
	fcm_token: {required: false, type: String},
	geolocation: {required: false, type: String},
	user_type: {required: false, type: String}, // individual | merchant
	last_name: {required: false, type: String},
	first_name: {required: false, type: String},
	merchant_name: {required: false, type: String},
});

module.exports = mongoose.model('Account', dataSchema);
