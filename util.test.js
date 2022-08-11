const { generateRandomNumber } = require('./util');

test('generateRandomNumber redundancy check', () => {
	function checkDuplicates(arr) {
		return new Set(arr).size !== arr.length
	}

	const pool = generateRandomNumber(6);
	expect(checkDuplicates(pool)).toBe(false);
});

test('generateRandomNumber interval redundancy check', () => {
	function checkDuplicates(arr) {
		return new Set(arr).size !== arr.length
	}

	const pool = generateRandomNumber(6, 100);
	expect(checkDuplicates(pool)).toBe(false);
});
