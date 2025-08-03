const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { use } = require("react");


exports.register = async ( req , res ) =>{
    try{
        const {
        email,
        password,
        first_name,
        last_name,
        dob,
        sex,
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [rows] = await db.promise().query("INSERT INTO  user (email, password, first_name, last_name, dob,sex) VALUES (?,?,?,?,?,?)",[
            email,
            hashedPassword,
            first_name,
            last_name,
            dob,
            sex, 
    
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

exports.login = async (req,res) =>{

    const { email , password} = req.body;

    if(!email || !password){
        return res.status(500).json({msg: "กรอบข้อมูลไม่ครบ"})
    }

    try {

        const [rows] = await db.promise().query("SELECT * FROM user WHERE email = ?", [email]);
        if(rows.length === 0){
            // console.log(rows);
            return res.status(400).json({msg : "ไม่พบผู้ใช้งานนี้"})
        }
        
        const user = rows[0];

        const isMatch = await bcrypt.compare(password , user.password)

        if(!isMatch){
            return res.status(401).json({msg: "รหัสผ่านไม่ถูกต้อง"})
        }


        const token = jwt.sign(
            {
                email:user.email,
                first_name:user.first_name,
            },"token",{ expiresIn : "1h"});

            res.status(200).json({
                msg : "เข้าสู่ระบบสำเร็จ",
                token, data:{
                    
                    first_name : user.first_name,
                    id_user : user.id_user,

                }
            });

    }catch (err){
        console.log("error Login", err)
        return res.status(500).json({ msg : "เกิดข้อผิดพลาดในการเข้าสู้ระบบ"})
    }
}

exports.adminLogin = async (req , res) => {
    const { username , password} = req.body;

    if(!username || !password){
        return res.status(500).json({msg: "กรอบข้อมูลไม่ครบ"})
    }

    try {

        const [rows] = await db.promise().query("SELECT * FROM admin WHERE username = ?", [username]);
        if(rows.length === 0){
            // console.log(rows);
            return res.status(400).json({msg : "ไม่พบผู้ใช้งานนี้"})
        }
        
        const admin = rows[0];

        const isMatch = await bcrypt.compare(password , admin.password)

        if(!isMatch){
            return res.status(401).json({msg: "รหัสผ่านไม่ถูกต้อง"})
        }


        const token = jwt.sign(
            {
                username:admin.username,
                first_name:admin.first_name,
            },"token",{ expiresIn : "1h"});

            res.status(200).json({
                msg : "เข้าสู่ระบบสำเร็จ",
                token, data:admin.first_name
            });

    }catch (err){
        console.log("error Login", err)
        return res.status(500).json({ msg : "เกิดข้อผิดพลาดในการเข้าสู้ระบบ"})
    }
}

exports.checktoken = (req,res)=>{
    return res.json({msg: `ยินดีตอนรับ ${req.user.first_name}` })
}