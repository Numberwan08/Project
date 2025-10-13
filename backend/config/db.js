const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
})

db.connect((err) =>{
    if(err){
        console.log("error connect database", err);
        return;
    }
    console.log("connect database success");
    try {
        db.query("SET NAMES utf8mb4");
    } catch (e) {}
})

module.exports = db;
