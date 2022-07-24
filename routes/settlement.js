const Config = require('../config');

const express = require('express');
const router = express.Router();
const Settlement = require('../models/settlement');
const passport = require('passport');

router.get('/',
	passport.authenticate('bearer', { session: false }),
	async (req, res) => {
		const settlements = await Settlement.find().lean();
		res.json({
			settlements: settlements,
		});
	}
);

module.exports = router;
