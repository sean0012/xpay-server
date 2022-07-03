const generate = (digits) => {
	const min = Math.pow(10, digits - 1);
	const max = Math.pow(10, digits) - 1;
	console.log(min, max);

	let pool = [];
	let i;
	for (i = min; i <= max; i++) {
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
};

const pool = generate(5)
console.log('generate pool:', pool)

module.exports = pool;
