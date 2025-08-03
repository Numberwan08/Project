const db = require('../config/db');

exports.member = async (req, res ) => {
try{
const [rows] = await db.promise().query("SELECT * FROM user");

    if(rows.length === 0){
        return res.status(404).json({ mag :"ไม่พบโพส"});
    }
        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", rows});
    }catch(err){
        console.log("ไม่สามารถดึงข้อมูลได้",err);
        return res.status(500).json({
            mag :"ดึงไม่สำเร็จ",
            error:err.message     
        })
    }
}
exports.allmember = async (req, res ) => {
try{
const [[rows]] = await db.promise().query("SELECT count(id_user) cccccc FROM user");

    if(rows.length === 0){
        return res.status(404).json({ mag :"ไม่พบโพส"});
    }
        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", rows});
    }catch(err){
        console.log("ไม่สามารถดึงข้อมูลได้",err);
        return res.status(500).json({
            mag :"ดึงไม่สำเร็จ",
            error:err.message     
        })
    }
}