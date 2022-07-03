require('dotenv').config();
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const DynamicCode = require('./models/dynamic_code');

mongoose.connect(mongoString);
const database = mongoose.connection;

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

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');

	const codes = DynamicCode.find({}, function(err, docs) {
		if (docs.length) {
			console.log('codes:',docs.length)
		} else {
			const pool = generate(4);
			const docs = pool.map(code => ({
				code: code,
				used: false,
			}))

			DynamicCode.insertMany(docs, (error, results) => {
				console.log('error:',error)
				console.log('docs:',results)

				database.close();
			});
		}
	});
});


//let pool = [];
// const pool = generate(2);

	// if (isNaN(count) || count === 0) {
	// 	console.log('Generate DynamicCode');
	// 	const pool = generate(2);
		// DynamicCode.insertMany(docs, (error, results) => {
		// 	console.log('error:',error)
		// 	console.log('docs:',results)
		// });
	// } else {
	// 	console.log(`DynamicCode count: ${count}`);
	// }

//module.exports = pool;
