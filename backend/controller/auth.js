const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


exports.register = async ( req , res ) =>{
    try{
        const {
        username,
        email,
        password,
        first_name,
        last_name,
        birth_date,
        gender_id,
        description_name} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [rows] = await db.promise().query("INSERT INTO  user (username, email, password, first_name, last_name, birth_date,gender_id, description_name) VALUES (?,?,?,?,?,?,?,?)",[
            username,
            email,
            hashedPassword,
            first_name,
            last_name,
            birth_date,
            gender_id, 
            description_name
        ])

        if(rows.affectedRows === 0){
            return res.status(400).json({
                msg : "error register",
                error : "ไม่สามารถสมัครสมาชิกได้"
            })
        }
        
        return res.status(201).json({
            msg : "register success"
        })  
    }catch(err){
        console.log("error register", err);
        return res.status(500).json({
            msg : "error register",
            error : err.message
        })
    }
}

exports.adminRegister = async ( req , res ) =>{
    try{
        const {
        username,
        password,
        first_name,} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [rows] = await db.promise().query("INSERT INTO  admin (username, password, first_name) VALUES (?,?,?)",[
            username,
            hashedPassword,
            first_name
        ])

        if(rows.affectedRows === 0){
            return res.status(400).json({
                msg : "error register",
                error : "ไม่สามารถสมัครสมาชิกได้"
            })
        }
        
        return res.status(201).json({
            msg : "register success"
        })  
    }catch(err){
        console.log("error register", err);
        return res.status(500).json({
            msg : "error register",
            error : err.message
        })
    }
}

exports.login = (req,res) =>{
    res.status(200).json({
        msg : "login success",
    })
}