const pool = require('./generateDynamicCode');

test('Dynamic code redundancy check', () => {
	function checkDuplicates(arr) {
		return new Set(arr).size !== arr.length
	}

	expect(checkDuplicates(pool)).toBe(false);
});
