require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const routes = require('./routes/routes');

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
	console.log(error);
});

database.once('connected', () => {
	console.log('Database Connected');
});

const app = express();

app.use(express.json());
app.use('/api/v1', routes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server Started at port ${port}`)
});
