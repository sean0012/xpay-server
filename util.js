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

const generateDynamicCode = async () => {
	const DynamicCode = require('./models/dynamic_code');

	const code = await DynamicCode.findOneAndUpdate(
		{used: false},
		{$set: {used: true}},
	).exec();
	return code.code;
};

const generateApprovalId = () => {
	const random3Digits = Math.floor(Math.random()*(999-100+1)+100);
	const timestampLast6Digits = Date.now().toString().slice(6);
	return `${timestampLast6Digits}${random3Digits}`
};

module.exports = { checkPrice, generateDynamicCode, generateApprovalId };
