const { generate } = require('./generateDynamicCode');

test('Dynamic code redundancy check', () => {
	function checkDuplicates(arr) {
		return new Set(arr).size !== arr.length
	}

	const pool = generate(4);
	expect(checkDuplicates(pool)).toBe(false);
});
