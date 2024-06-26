const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const amt = req.body.Amt;
    const authToken = req.body.AuthToken;
    const authorization = `Bearer ${authToken}`;

    const obj = {
        amt,
        authorization,
    };
    console.log('POST payment obj:', obj);

    res.render('payment', obj);
});

router.get('/', (req, res) => {
    const obj = {
        amt: '500',
        authorization: 'test auth',
    };
    console.log('GET payment obj:', obj);

    res.render('payment', obj);
});


module.exports = router;
