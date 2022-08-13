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

const generateVirtualBankAccountNumber = async () => {
	const VirtualAccount = require('./models/virtual_account');

	const accountNumber = await VirtualAccount.findOneAndUpdate(
		{used: false},
		{$set: {used: true}},
	).exec();
	return accountNumber.bank_account;
};

const generateApprovalId = () => {
	const random3Digits = Math.floor(Math.random()*(999-100+1)+100);
	const timestampLast6Digits = Date.now().toString().slice(6);
	return `${timestampLast6Digits}${random3Digits}`
};

const generateRandomNumber = (digits, gap = 1) => {
	const min = Math.pow(10, digits - 1);
	const max = Math.pow(10, digits) - 1;
	console.log(min, max);

	let pool = [];
	let i;
	for (i = min; i <= max; i += gap) {
		pool.push(String(i));
	}

	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	shuffleArray(pool);
	return pool;	
}

module.exports = {
	checkPrice,
	generateDynamicCode,
	generateApprovalId,
	generateRandomNumber,
	generateVirtualBankAccountNumber,
};
