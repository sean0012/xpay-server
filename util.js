const checkPrice = (amount, items) => {
	if (!Array.isArray(items)) {
		return false;
	}
	let total = 0;
	items.map(item => {
		if ('price' in item && 'quantity' in item) {
			total += +item.price * +item.quantity;
		}
	});
	return amount === total;
};


//const crypto = require('crypto');

const generateDynamicCode = (id) => {
	//const salt = 'xpayrandomisesalt';
	const t = Date.now();
	//const code = `${id}${salt}${t}`;
	//console.log('code:',code);
	//return crypto.createHash('sha256').update(code).digest('base64');
	return t.toString().slice(1);
};

module.exports = { checkPrice, generateDynamicCode };
