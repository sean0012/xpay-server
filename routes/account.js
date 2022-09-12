require('dotenv').config();

const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Version = require('../models/version');
const Account = require('../models/account');
const Settlement = require('../models/settlement');
const MarketPrice = require('../models/market_price');
const passport = require('passport');

// 초기화면 앱 구동 버전 체크
router.post('/first_run', async (req, res) => {
	// validate required params
	if (!req.body.version) {
		res.status(400).json({
			error: {
				code: 'MISSING_REQUIRED_PARAMS',
				message: 'Parameter version is required'
			}
		});
		return;
	}
	const paramVersion = Number(req.body.version)
	if (isNaN(paramVersion)) {
		res.status(400).json({
			error: {
				code: 'INVALID_PARAMS',
				message: 'Parameter version is not a number'
			}
		});
		return;
	}

	// retrieve DB value
	const v = await Version.findOne().exec();

	// respond version check result
	if (paramVersion < Number(v.version_min)) {
		res.json({ result: 'MUST' });
	} else if (paramVersion < Number(v.version)) {
		res.json({ result: 'LOW' });
	} else {
		res.json({ result: 'OK' });
	}
});

// 최초지갑등록
router.post('/registration', async (req, res) => {
	// validate required params
	if (!req.body.wallet) {
		res.status(400).json({
			error: {
				code: 'MISSING_REQUIRED_PARAMS',
				message: 'Parameter wallet is required'
			}
		});
		return;
	}
	if (!req.body.secret_hash) {
		res.status(400).json({
			error: {
				code: 'MISSING_REQUIRED_PARAMS',
				message: 'Parameter secret_hash is required'
			}
		});
		return;
	}

	// check DB redundancy
	const accountByAddress = await Account.findOne({wallet:req.body.wallet}).exec();
	if (accountByAddress) {
		res.status(422).json({
			error: {
				code: 'WALLET_EXISTS',
				message: 'Wallet exists'
			}
		});
		return;
	}

	const payload = {
		wallet: req.body.wallet,
		secret_hash: req.body.secret_hash
	};
	const account = await Account.findOne(payload).exec();

	if (!account) {
		const auth_token = jwt.encode(payload, process.env.JWT_SECRET);
		const newAccount = new Account({
			wallet: payload.wallet,
			secret_hash: payload.secret_hash,
			auth_token: auth_token,
			collateral_name: 'MRF',
			collateral_amount: 0,
			collateral: 0,
			collateral_balance: 0,
			collateral_liquidation: 0,
			token_name: 'MRF.KRW',
			token_limit: 0,
			token_using: 0,
			token_balance: 0,
			withdrawable: 0,
			deposit: 0,
			points: 1000,
			grade: 3,
		});
		const created = await newAccount.save();
		res.json({
			auth_token: auth_token
		});
	} else {
		res.status(422).json({
			error: {
				code: 'ACCOUNT_EXISTS',
				message: 'Account exists'
			}
		});
	}
});

router.post('/recovery', async (req, res) => {
	if (!req.body.secret_hash) {
		res.status(400).json({
			error: {
				code: 'MISSING_REQUIRED_PARAMS',
				message: 'Parameter secret_hash is required'
			}
		});
		return;
	}

	const account = await Account.findOne({secret_hash: req.body.secret_hash}).exec();
	if (!account) {
		res.status(400).json({
			error: {
				code: 'NOT_FOUND',
				message: 'secret_hash not found'
			}
		});
		return;
	}

	res.json({
		result: 'OK',
		auth_token: account.auth_token,
		last_name: account.last_name,
		first_name: account.first_name,
		birth_date: account.birth_date,
		phone: account.phone,
		email: account.email,
		merchant_name: account.merchant_name,
		business_registration: account.business_registration,
		v_bank: account.v_bank,
		v_bank_account: account.v_bank_account,
		bank_name: account.bank_name,
		bank_account: account.bank_account,
		autotransfer: account.autotransfer,
	});
});

// 한도변경신청
router.post('/limitation', passport.authenticate('bearer', { session: false }), async (req, res) => {
	// validate params
	if (!req.body.amount) {
		res.status(400).json({
			error: {
				code: 'MISSING_REQUIRED_PARAMS',
				message: 'Parameter amount is required'
			}
		});
		return;
	}
	const amount = Number(req.body.amount);
	if (isNaN(amount)) {
		res.status(400).json({
			error: {
				code: 'INVALID_PARAMS',
				message: 'Parameter amount is not a number'
			}
		});
		return;
	}

	res.json({
		result: 'OK',
	});
});


// 지갑현황
router.get('/status',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const upcomingSettlement = await Settlement.findOne({done: false}).sort('date').exec();
		const paymentDate = upcomingSettlement ? upcomingSettlement.date : '';
		const collateralPrice = await MarketPrice.findOne({}, {}, { sort: { 'timestamp' : -1 } }).exec();
		const price = +collateralPrice.close;
		const collateralValue = req.user.collateral_amount * price;

		res.json({
			wallet: req.user.wallet,
			collateral_name: req.user.collateral_name,
			collateral_amount: req.user.collateral_amount,
			collateral_price: price,
			collateral: collateralValue,
			collateral_balance: req.user.collateral_balance,
			collateral_liquidation: req.user.collateral_liquidation,
			token_name: req.user.token_name,
			token_limit: req.user.token_limit,
			token_using: req.user.token_using,
			token_balance: req.user.token_balance,
			points: req.user.points,
			grade: req.user.grade,
			user_type: req.user.user_type,
			first_name: req.user.first_name,
			last_name: req.user.last_name,
			merchant_name: req.user.merchant_name,
			withdrawable: req.user.withdrawable,
			deposit: req.user.deposit,
			payment_date: paymentDate,
			payment_now: req.user.payment_thismonth,
			v_bank: req.user.v_bank,
			v_bank_account: req.user.v_bank_account,
		});
	}
);

// 개인정보 정정
router.patch('/modi_my', passport.authenticate('bearer', { session: false }), async (req, res) => {
	if (req.body.last_name) {
		req.user.last_name = req.body.last_name;
	}
	if (req.body.first_name) {
		req.user.first_name = req.body.first_name;
	}
	if (req.body.birth_date) {
		req.user.birth_date = req.body.birth_date;
	}
	if (req.body.phone) {
		req.user.phone = req.body.phone;
	}
	if (req.body.email) {
		req.user.email = req.body.email;
	}
	if (req.body.address) {
		req.user.address = req.body.address;
	}
	if (req.body.merchant_name) {
		req.user.merchant_name = req.body.merchant_name;
	}
	if (req.body.business_registration) {
		req.user.business_registration = req.body.business_registration;
	}
 	const updatedUser = await req.user.save();
 	res.json({
 		first_name: updatedUser.first_name,
		last_name: updatedUser.last_name,
		birth_date: updatedUser.updatedUser,
		merchant_name: updatedUser.merchant_name,
		phone: updatedUser.phone,
		email: updatedUser.email,
		address: updatedUser.address,
		merchant_name: updatedUser.merchant_name,
		business_registration: updatedUser.business_registration,
 	});
});

// 은행정보 등록
router.patch('/modi_bank', passport.authenticate('bearer', { session: false }), async (req, res) => {
	if (req.body.bank_cs_name) {
		req.user.bank_cs_name = req.body.bank_cs_name;
	}
	if (req.body.bank_cs_birth) {
		req.user.bank_cs_birth = req.body.bank_cs_birth;
	}
	if (req.body.bank_name) {
		req.user.bank_name = req.body.bank_name;
	}
	if (req.body.bank_account) {
		req.user.bank_account = req.body.bank_account;
	}
 	const updatedUser = await req.user.save();
 	res.json({
 		bank_cs_name: updatedUser.bank_cs_name,
		bank_cs_birth: updatedUser.bank_cs_birth,
		bank_name: updatedUser.bank_name,
		bank_account: updatedUser.bank_account,
 	});
});

// 자동인출 설정
router.patch('/modi_aubanking', passport.authenticate('bearer', { session: false }), async (req, res) => {
	console.log('AUBANK:',req.body.autobanking);
	if (req.body.autobanking) {
		req.user.autobanking = req.body.autobanking.toUpperCase() === 'YES'
	}
 	const updatedUser = await req.user.save();
 	res.json({
 		autobanking: updatedUser.autobanking
 	});
});

module.exports = router;
