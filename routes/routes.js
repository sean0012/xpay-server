require('dotenv').config();

const jwt = require('jwt-simple');
const express = require('express');
const router = express.Router();
const Version = require('../models/version');
const Account = require('../models/account');

const passport = require('passport');
const Strategy = require('passport-http-bearer').Strategy;

passport.use(new Strategy(async (token, cb) => {
	const account = await Account.findOne({auth_token: token}).exec();

	if (!account) {
		console.log('No account');
		return cb(null, false);
	} else {
		console.log('Account success!');
		return cb(null, account);
	}
}));

// 초기화면 앱 구동 버전 체크
router.post('/account/first_run', async (req, res) => {
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
router.post('/account/registration', async (req, res) => {
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
			collateral_price: 1000,
			collateral: 0,
			collateral_balance: 0,
			collateral_liquidation: 0,
			token_name: 'MRF.KRW',
			token_limit: 0,
			token_using: 0,
			token_balance: 0,
		});
		const created = await newAccount.save();
		res.json({
			fin_num: auth_token
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

// 지갑현황
router.get('/account/status',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		res.json({
			wallet: req.user.wallet,
			collateral_name: req.user.collateral_name,
			collateral_amount: req.user.collateral_amount,
			collateral_price: req.user.collateral_price,
			collateral: req.user.collateral,
			collateral_balance: req.user.collateral_balance,
			collateral_liquidation: req.user.collateral_liquidation,
			token_name: req.user.token_name,
			token_limit: req.user.token_limit,
			token_using: req.user.token_using,
			token_balance: req.user.token_balance,
		});
	}
);

module.exports = router;
