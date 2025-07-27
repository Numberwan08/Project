
const db = require("../config/db");
const fs = require('fs');
const deleteImage =(path)=>{
    fs.unlink(path,(err)=>{
        if(err){
            console.error("Error deleting image:", err);
        }else{
            console.log("Image deleted successfully");
        }
    });
};


exports.get_event = async (req , res )=> {
    res.json({
        mag: "api แสดงกิจกรรม"
    })
}

exports.add_event = async (req , res )=> {
    try{
    console.log("req.bady",req.bady);
        const {
            id_user,
            name_event,
            location_event,
            phone,
            detail_event,
            date,
            images,
            latitude,
            longitude
        }=req.body;

        const [rows]=await db.promise().query("INSERT INTO user_event (id_user, name_event, location_event, phone, detail_event, date, images, latitude, longitude) VALUES (?,?,?,?,?,?,?,?,?)",[
            id_user,
            name_event,
            location_event,
            phone,
            detail_event,
            date,
            images,
            latitude,
            longitude
        ])

        if(rows.affectedRows === 0) {
            return res.status(400).json({
                mag: "ไม่สามารถเพิ่มกิจกรรมได้",
                error: "ไม่สามารถเพิ่มกิจกรรมได้"
            })
        }

        return res.status(201).json({
            mag: "เพิ่มกิจกรรมสำเร็จ"
        })
    }catch(err){
        console.log("error add_event",err);
        return res.status(500).json({
            mag: "ไม่สามารถเพิ่มกิจกรรมได้",
            error: err.message
        })
    }
}

exports.edit_event = async (req , res )=> {
    const {id} = req.params;
    const {
        name_event,
        location_event,
        phone,
        detail_event,
        date,
        images,
        latitude,
        longitude
    } = req.body;
    try{

        const [rows] = await db.promise().query("UPDATE user_event SET name_event = ?, location_event = ?, phone = ?, detail_event = ?, date = ?, images = ?, latitude = ?, longitude = ? WHERE id_event = ?", [
            name_event,
            location_event,
            phone,
            detail_event,
            date,
            images,
            latitude,
            longitude,
            id
        ]);

        if(rows.affectedRows === 0) {
            return res.status(400).json({
                mag: "ไม่สามารถแก้ไขกิจกรรมได้",
                error: "ไม่สามารถแก้ไขกิจกรรมได้"
            });
        }

        return res.status(200).json({
            mag: "แก้ไขกิจกรรมสำเร็จ"
        });

    }catch(err){
        console.log("error edit_event",err);
        return res.status(500).json({
            mag: "ไม่สามารถแก้ไขกิจกรรมได้",
            error: err.message
        })
    }
}

exports.delete_event = async (req , res )=> {
    try{
       
        const {id} = req.params;

        const [rows] =await db.promise().query("SELECT * FROM user_event WHERE id_event = ?",[id]);

        if(rows.length === 0){
            return res.status(404).json({
                mag: "ไม่พบกิจกรรมที่ต้องการลบ",
                error: "ไม่พบกิจกรรมที่ต้องการลบ"
            })
        }
        const [result] = await db.promise().query("DELETE FROM user_event WHERE id_event = ?", [id]);
        if(result.affectedRows === 0) {
            return res.status(400).json({
                mag: "ไม่สามารถลบกิจกรรมได้",
                error: "ไม่สามารถลบกิจกรรมได้"
            });
        }
        return res.status(200).json({
            mag: "ลบกิจกรรมสำเร็จ"
        });

    } catch(err){
        console.log("error delete_event",err);
        return res.status(500).json({
            mag: "ไม่สามารถลบกิจกรรมได้",
            error: err.message
        })
    }
   
}