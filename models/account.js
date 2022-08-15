const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
	wallet: {required: true, type: String},
	secret_hash: {required: true, type: String},
	auth_token: {required: true, type: String},
	collateral_name: {required: true, type: String},
	collateral_amount: {required: true, type: Number},
	collateral_balance: {required: true, type: Number, default: 0}, // 담보코인 해제가능 수량
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
	user_type: {required: true, type: String, uppercase: true, default: 'INDIVIDUAL'}, // INDIVIDUAL | MERCHANT | ADMIN
	last_name: {required: false, type: String},
	first_name: {required: false, type: String},
	v_bank: {require: false, type: String},
	v_bank_account: {required: false, type: String},
	merchant_name: {required: false, type: String},
	merchant_fee_rate: {required: false, type: Number},
	merchant_points_rate: {required: false, type: Number},
	payment_thismonth: {required: true, type: Number, default: 0},
	payment_nextmonth: {required: true, type: Number, default: 0},
});

module.exports = mongoose.model('Account', dataSchema);
