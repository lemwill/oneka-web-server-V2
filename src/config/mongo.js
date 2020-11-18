const mongoose = require('mongoose');
const winston = require('./winston');

const start = async () => {
  try {
    const username = process.env.MONGO_ROOT_USERNAME;
    const password = process.env.MONGO_ROOT_PASSWORD;
    const host = process.env.MONGO_HOST;
    const dbname = process.env.MONGO_DB;

    const db = await mongoose.connect(`mongodb://${host}/${dbname}`, {
      auth: {
        authSource: 'admin',
      },
      user: username,
      pass: password,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    return db;
  } catch (err) {
    winston.error(`Unable to connect to mongo: ${err}`);
    return null;
  }
};

module.exports = start;
