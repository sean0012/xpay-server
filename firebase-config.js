const admin = require('firebase-admin');
const serviceAccount = require('./xpay-90e98-firebase-adminsdk-3z9yc-411a13b2c7.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

module.exports.admin = admin;
