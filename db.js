require('dotenv').config(); // Ensure you have this line if you're using dotenv for environment variables
const mysql = require('mysql2/promise');

async function connectToDatabase() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Winnie01',
      database: process.env.DB_NAME || 'mydatabase'
    });

    console.log('Successfully connected to the database.');
    return db;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1); // Exit the process with an error code
  }
}

module.exports = connectToDatabase;

