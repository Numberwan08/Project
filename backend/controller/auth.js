const db = require("../config/db");
const bcrypt = require("bcrypt");
const e = require("express");
const jwt = require("jsonwebtoken");
const { use } = require("react");
const fs = require('fs');


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
        const image = req.file;
        
        const [existingUser] = await db.promise().query("SELECT id_user FROM user WHERE email = ?", [email]);
        
        if(existingUser.length > 0){
            return res.status(400).json({
                msg : "อีเมล์นี้ถูกใช้งานแล้ว",
                error : "อีเมล์นี้ถูกใช้งานแล้ว"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const normalizedFirstName = (first_name || "").replace(/\s+/g, " ").trim();
        if (!normalizedFirstName) {
            return res.status(400).json({
                msg: "กรุณาระบุชื่อ",
                error: "first_name required"
            });
        }
        const [existingName] = await db.promise().query(
            "SELECT id_user FROM user WHERE first_name = ? LIMIT 1",
            [normalizedFirstName]
        );
        if (existingName.length > 0) {
            return res.status(400).json({
                msg: "มีคนใช้ชื่อนี้แล้ว",
                error: "duplicate first_name"
            });
        }

        const [rows] = await db.promise().query("INSERT INTO  user (email, password, first_name, last_name, dob, sex, image_profile) VALUES (?,?,?,?,?,?,?)",[
            email,
            hashedPassword,
            normalizedFirstName,
            last_name,
            dob,
            sex,
            image ? image.path : null,

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

        // ถ้าบัญชีถูกระงับ (status = 0) ให้แจ้งและไม่อนุญาตให้เข้าสู่ระบบ
        if (String(user.status ?? '1') === '0') {
            return res.status(403).json({ msg: "บัญชีของคุณถูกระงับ" });
        }

        const isMatch = await bcrypt.compare(password , user.password)

        if(!isMatch){
            return res.status(401).json({msg: "รหัสผ่านไม่ถูกต้อง"})
        }


        const token = jwt.sign(
            {
                email:user.email,
                first_name:user.first_name,
            },"token",{ expiresIn : "1h"});

            // Extra: fetch report notifications for this user (comments/replies reported against them)
            let pending_count = 0;
            let resolved_count = 0;
            let pending_examples = [];
            let resolved_examples = [];
            try {
                
                const [[pRow]] = await db
                    .promise()
                    .query('SELECT COUNT(*) AS c FROM report_comment WHERE target_user_id = ? AND status = 1', [user.id_user]);
                const [[rRow]] = await db
                    .promise()
                    .query('SELECT COUNT(*) AS c FROM report_comment WHERE target_user_id = ? AND status = 0', [user.id_user]);
                pending_count = Number(pRow?.c || 0);
                resolved_count = Number(rRow?.c || 0);

                const [pList] = await db
                    .promise()
                    .query(
                        `SELECT 
                            id_report_comment,
                            id_commnet AS id_comment,
                            id_reply,
                            id_post,
                            id_event_comment,
                            id_event_reply,
                            id_event,
                            reason,
                            status,
                            created_at,
                            CASE WHEN id_event_comment IS NOT NULL OR id_event_reply IS NOT NULL THEN 'event' ELSE 'post' END AS source,
                            CASE WHEN id_reply IS NOT NULL OR id_event_reply IS NOT NULL THEN 'reply' ELSE 'comment' END AS entity_type
                         FROM report_comment
                         WHERE target_user_id = ? AND status = 1
                         ORDER BY created_at DESC, id_report_comment DESC
                         LIMIT 5`,
                        [user.id_user]
                    );
                const [rList] = await db
                    .promise()
                    .query(
                        `SELECT 
                            id_report_comment,
                            id_commnet AS id_comment,
                            id_reply,
                            id_post,
                            id_event_comment,
                            id_event_reply,
                            id_event,
                            reason,
                            status,
                            created_at,
                            CASE WHEN id_event_comment IS NOT NULL OR id_event_reply IS NOT NULL THEN 'event' ELSE 'post' END AS source,
                            CASE WHEN id_reply IS NOT NULL OR id_event_reply IS NOT NULL THEN 'reply' ELSE 'comment' END AS entity_type
                         FROM report_comment
                         WHERE target_user_id = ? AND status = 0
                         ORDER BY created_at DESC, id_report_comment DESC
                         LIMIT 5`,
                        [user.id_user]
                    );
                pending_examples = pList || [];
                resolved_examples = rList || [];
            } catch (_) {}

            res.status(200).json({
                msg : "เข้าสู่ระบบสำเร็จ",
                token,
                data: {
                    first_name : user.first_name,
                    id_user : user.id_user,
                },
                notifications: {
                    reports: {
                        pending_count,
                        resolved_count,
                        pending_examples,
                        resolved_examples
                    }
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
        // Block suspended users
        if (String(user.status ?? '1') === '0') {
            return res.status(403).json({ msg: "บัญชีของคุณถูกระงับ" });
        }

        // ถ้าบัญชีถูกระงับ (status = 0) ให้แจ้งและไม่อนุญาตให้เข้าสู่ระบบ
        if (typeof user.status !== 'undefined' && String(user.status) === '0') {
            return res.status(403).json({ msg: "บัญชีของคุณถูกระงับ" });
        }
        if (user.image_profile) {
            user.image_profile = `${req.protocol}://${req.headers.host}/${user.image_profile}`;
        }
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
        const image = req.file;

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

        // อัปเดตข้อมูลโปรไฟล์ และรูปถ้ามีการอัปโหลดใหม่
        let result;
        if (image) {
            try {
                const [oldRows] = await db.promise().query("SELECT image_profile FROM user WHERE id_user = ?", [req.params.id]);
                const oldPath = oldRows.length > 0 ? oldRows[0].image_profile : null;
                if (oldPath && fs.existsSync(oldPath)) {
                    fs.unlink(oldPath, () => {});
                }
            } catch (e) {
                // ignore
            }
            const [resUpd] = await db.promise().query(
                "UPDATE user SET first_name = ?, last_name = ?, Email = ?, image_profile = ? WHERE id_user = ?",
                [first_name, last_name, Email, image.path, req.params.id]
            );
            result = resUpd;
        } else {
            const [resUpd] = await db.promise().query(
                "UPDATE user SET first_name = ?, last_name = ?, Email = ? WHERE id_user = ?",
                [first_name, last_name, Email, req.params.id]
            );
            result = resUpd;
        }

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
        if (user.image_profile) {
            user.image_profile = `${req.protocol}://${req.headers.host}/${user.image_profile}`;
        }

        return res.status(200).json({
            msg : "edit profile success",
            data : user
        })  
        
    }catch(err){
        console.log("error edit profile", err);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }
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
        await db.promise().query("UPDATE user SET status = 0 WHERE id_user = ?", [id]);
        return res.status(200).json({
            msg: "ระงับสมาชิกสำเร็จ"
        });
    } catch (err) {
        console.log("error delete user", err);
        return res.status(500).json({
            msg: "ไม่สามารถระงับสมาชิกได้",
            error: err.message
        });
    }
}

// อัปเดตสถานะผู้ใช้ (0 = ระงับ, 1 = ปลดระงับ)
exports.update_user_status = async (req, res) => {
    try {
        const { id } = req.params;
        let { status } = req.body;

        const [rows] = await db.promise().query("SELECT * FROM user WHERE id_user = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                msg: "ไม่พบผู้ใช้งานนี้",
                error: "ไม่พบผู้ใช้งานนี้"
            });
        }

        if (typeof status === 'undefined' || status === null || status === '') {
            const current = String(rows[0].status ?? '1');
            status = current === '0' ? 1 : 0;
        }
        status = Number(status) === 0 ? 0 : 1;

        await db.promise().query("UPDATE user SET status = ? WHERE id_user = ?", [status, id]);
        return res.status(200).json({
            msg: status === 0 ? "ระงับผู้ใช้เรียบร้อย" : "ปลดระงับผู้ใช้เรียบร้อย",
            data: { id_user: id, status }
        });
    } catch (err) {
        console.log("error update user status", err);
        return res.status(500).json({
            msg: "ไม่สามารถอัปเดตสถานะผู้ใช้ได้",
            error: err.message
        });
    }
}
