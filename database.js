const mongoose = require('mongoose');

function connectToDatabase() {
  const connectionString = process.env.DB_CONNECTION_STRING;
  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db = mongoose.connection;
  db.on('err', () => {
    console.log('Failed to connect to database.');
    process.exit(1);
  });
  db.once('open', () => {
    console.log('Connected to database.');
  });
}

module.exports = { connectToDatabase };
