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

const generateDynamicCode = async () => {
	const DynamicCode = require('./models/dynamic_code');

	const code = await DynamicCode.findOneAndUpdate(
		{used: false},
		{$set: {used: true}},
	).exec();
	return code.code;
};

module.exports = { checkPrice, generateDynamicCode };
