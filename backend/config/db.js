const mysql = require('mysql2');
const dotenv = require('dotenv');
console.log('CWD:', process.cwd());
dotenv.config();
console.log("Connecting to database...");
console.log("USER:", process.env.DB_USER);
console.log("PASSWORD:", process.env.DB_PASSWORD);
