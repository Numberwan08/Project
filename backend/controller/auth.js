const db = require("../config/db");
const bcrypt = require("bcrypt");
const e = require("express");
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
        
        const [existingUser] = await db.promise().query("SELECT id_user FROM user WHERE email = ?", [email]);
        
        if(existingUser.length > 0){
            return res.status(400).json({
                msg : "อีเมล์นี้ถูกใช้งานแล้ว",
                error : "อีเมล์นี้ถูกใช้งานแล้ว"
            })
        }

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
                msg : "ไม่สามารถสมัครสมาชิกได้",
                error : "ไม่สามารถสมัครสมาชิกได้"
            })
        }
        
        return res.status(201).json({
            msg : "สมัครสมาชิกสำเร็จ"
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

        const isMatch = password == admin.password

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


exports.get_user = async (req, res) =>{
    try{
        const [rows] = await db.promise().query("SELECT * FROM user WHERE id_user = ?", [req.params.id]);
        if(rows.length === 0){
            console.table(rows);
            return res.status(404).json({msg : "ไม่พบผู้ใช้งานนี้"})
        }
        // console.log(rows);
        const user = rows[0];
        console.log(user);
        return res.status(200).json({data : user})
    }catch(err){
        console.log("error get user", err);
        return res.status(500).json({
            msg : "error get user",
            error : err.message
        })
    }
}

exports.edit_user = async (req, res) =>{
    try{
        const {
            first_name,
            last_name,
            Email,
            oldPassword,
            newPassword
        } = req.body;

        if (oldPassword && newPassword) {
            
            const [userRows] = await db.promise().query("SELECT * FROM user WHERE id_user = ?", [req.params.id]);
            if (userRows.length === 0) {
                return res.status(404).json({msg : "ไม่พบผู้ใช้งานนี้"});
            }
            const user = userRows[0];
            const bcrypt = require("bcrypt");
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    msg: "รหัสผ่านเก่าไม่ถูกต้อง",
                    error: "รหัสผ่านเก่าไม่ถูกต้อง"
                });
            }
            // อัปเดตรหัสผ่านใหม่
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.promise().query("UPDATE user SET password = ? WHERE id_user = ?", [hashedPassword, req.params.id]);
        }

        // อัปเดตข้อมูลโปรไฟล์
        const [result] = await db.promise().query("UPDATE user SET first_name = ?, last_name = ?, Email = ? WHERE id_user = ?",[
            first_name,
            last_name,
            Email,
            req.params.id
        ]);

        if(result.affectedRows === 0){
            return res.status(400).json({
                msg : "error edit profile",
                error : "ไม่สามารถแก้ไขโปรไฟล์ได้"
            })
        }

        const [rows] = await db.promise().query("SELECT * FROM user WHERE id_user = ?", [req.params.id]);
        if(rows.length === 0){
            return res.status(404).json({msg : "ไม่พบผู้ใช้งานนี้"})
        }
        const user = rows[0];

        return res.status(200).json({
            msg : "edit profile success",
            data : user
        })  
        
    }catch(err){
        console.log("error edit profile", err);
        return res.status(500).json({
            msg : "error edit profile",
            error : err.message
        })
    }
}

exports.delete_user = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.promise().query("SELECT * FROM user WHERE id_user = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                msg: "ไม่พบผู้ใช้งานนี้",
                error: "ไม่พบผู้ใช้งานนี้"
            });
        }
        await db.promise().query("DELETE FROM user WHERE id_user = ?", [id]);
        return res.status(200).json({
            msg: "ลบสมาชิกสำเร็จ"
        });
    } catch (err) {
        console.log("error delete user", err);
        return res.status(500).json({
            msg: "ไม่สามารถลบสมาชิกได้",
            error: err.message
        });
    }
}