
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
    try{
        const [rows] = await db.promise().query("SELECT * FROM user_event");
        if(rows.length === 0){
            return res.status(404).json({ mag :"ไม่พบกิจกรรม"}); 
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`:null,
        }));
        return res.status(200).json({mag :"ดึงข้อมูลกิจกรรมสำเร็จ", data: formatData});
    }catch(err){
        console.log("error get event", err);
        return res.status(500).json({
            mag: "ไม่สามารถดึงข้อมูลกิจกรรมได้",
            error: err.message
        })
    }
}

exports.get_events = async (req, res) =>{
    const {id} =req.params;
    try{

        const [rows] = await db.promise().query(`SELECT 
            t1.id_event,t1.name_event,t1.location_event,t1.phone,t1.detail_event,t1.date_start,t1.images,t1.latitude,t1.longitude,t1.date_end,t2.first_name,
            COUNT(t3.id_event) likes
            FROM user_event t1
            JOIN user t2 ON t1.id_user = t2.id_user 
            JOIN like_event t3 ON t1.id_event = t3.id_event
            WHERE t1.id_event = ?`,[id]);
    
        if(rows.length === 0){
            return res.status(404).json({mag:"ไม่พบกิจกรรม"});
        }

    const formatData =rows.map((row)=>({
        ...row,
        images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`:null,
    }));

    return res.status(200).json({mag :"ดึงข้อมูลสินค้าสำเร็จ",data:formatData})


    }catch(err){
        console.log("error get data",err);
        return res.status(500).json({
            mag:"ไม่สามารถดึงข้อมูลได้",
            error : err.message
        })
    }
}

exports.get_event_me = async (req , res )=> {
    const {id} = req.params;
    try{

        const [rows] = await db.promise().query("SELECT * FROM user_event WHERE id_user = ?",[id]);
        if(rows.length === 0){
            return res.status(404).json({ mag :"ไม่พบกิจกรรม"}); 
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`:null,
        }));
        return res.status(200).json({mag :"ดึงข้อมูลกิจกรรมสำเร็จ", data: formatData});
    }catch(err){
        console.log("error get event", err);
        return res.status(500).json({
            mag: "ไม่สามารถดึงข้อมูลกิจกรรมได้",
            error: err.message
        })
    }
}

exports.add_event = async (req , res )=> {
    const [[{max_id}]] = await db.promise().query("SELECT MAX(id_event) as max_id FROM user_event ")

    // console.log("req.bady",req.bady);
        const {
            id_user,
            name_event,
            location_event,
            phone,
            detail_event,
            date_start,
            date_end,
            latitude,
            longitude,
            type
        }=req.body;

        const image = req.file;

    try{
        const [rows]=await db.promise().query("INSERT INTO user_event (id_event,id_user, name_event, location_event, phone, detail_event, date_start,date_end, images, latitude, longitude,type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",[
            max_id+1,
            id_user,
            name_event,
            location_event,
            phone,
            detail_event,
            date_end,
            date_start,
            image.path,
            latitude,
            longitude,
            type
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

exports.edit_event = async (req, res) => {
    const { id } = req.params;
    let {
        name_event,
        location_event,
        phone,
        detail_event,
        date_start,
        date_end,
        latitude,
        longitude,
        type
    } = req.body;

    try {
        // ตรวจสอบว่ามีการอัปโหลดไฟล์ใหม่หรือไม่
        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path;
            // ลบรูปเดิม (ถ้ามี)
            const [oldRows] = await db.promise().query("SELECT images FROM user_event WHERE id_event = ?", [id]);
            if (oldRows.length > 0 && oldRows[0].images && fs.existsSync(oldRows[0].images)) {
                deleteImage(oldRows[0].images);
            }
        }

        // ถ้าไม่ได้อัปโหลดรูปใหม่ ให้ใช้ path เดิม
        if (!imagePath) {
            const [oldRows] = await db.promise().query("SELECT images FROM user_event WHERE id_event = ?", [id]);
            imagePath = oldRows.length > 0 ? oldRows[0].images : null;
        }

        const [rows] = await db.promise().query(
            "UPDATE user_event SET name_event = ?, location_event = ?, phone = ?, detail_event = ?, date_start = ?, date_end = ?, images = ?, latitude = ?, longitude = ?, type = ? WHERE id_event = ?",
            [
                name_event,
                location_event,
                phone,
                detail_event,
                date_start,
                date_end,
                imagePath,
                latitude,
                longitude,
                type,
                id
            ]
        );

        if (rows.affectedRows === 0) {
            return res.status(400).json({
                mag: "ไม่สามารถแก้ไขกิจกรรมได้",
                error: "ไม่สามารถแก้ไขกิจกรรมได้"
            });
        }

        return res.status(200).json({
            mag: "แก้ไขกิจกรรมสำเร็จ"
        });

    } catch (err) {
        console.log("error edit_event", err);
        return res.status(500).json({
            mag: "ไม่สามารถแก้ไขกิจกรรมได้",
            error: err.message
        });
    }
};

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

        // ลบไฟล์ภาพถ้ามี
        const imagePath = rows[0].images;
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }

        
        const [result] = await db.promise().query("DELETE FROM user_event WHERE id_event = ?", [id]);
        if(result.affectedRows === 0) {
            return res.status(400).json({
                mag: "ไม่สามารถลบกิจกรรมได้",
                error: "ไม่สามารถลบกิจกรรมได้"
            });
        }
        return res.status(200).json({
            msg: "ลบกิจกรรมสำเร็จ"
        });

    } catch(err){
        console.log("error delete_event",err);
        return res.status(500).json({
            mag: "ไม่สามารถลบกิจกรรมได้",
            error: err.message
        })
    }
   
} 
exports.likes = async (req, res) => {
      const {id} = req.params;
    const {userId} = req.body;
    
    try{
        const [existingLike] = await db.promise().query("SELECT * FROM like_event WHERE id_event = ? AND id_user = ?", [id, userId]);
        if(existingLike.length > 0){
                console.log('1')
            return res.status(400).json({
                msg: "คุณได้กดไลค์โพสต์นี้แล้ว",
                error: "คุณได้กดไลค์โพสต์นี้แล้ว"
            });
            
        }
        const [rows] = await db.promise().query("INSERT INTO like_event (id_event,id_user) VALUES (?,?)",[id, userId]);
        if(rows.affectedRows === 0){
                
            return res.status(400).json({
                msg: "ไม่สามารถกดไลค์โพสต์ได้",
                error: "ไม่สามารถกดไลค์โพสต์ได้"
            });
        }
        return res.status(200).json({
            msg: "กดไลค์โพสต์สำเร็จ"
        });
    }catch(err){
        console.log("error likes post", err);
        return res.status(500).json({
            msg: "ไม่สามารถกดไลค์โพสต์ได้",
            error: err.message
        });
    }
};


// เช็คสถานะไลค์ของ user กับ post
exports.likes_check = async (req, res) => {
    const { id_event, id_user } = req.params;
    try {
        const [rows] = await db.promise().query("SELECT * FROM like_event WHERE id_event = ? AND id_user = ?", [id_event, id_user]);
        if (rows.length > 0) {
            return res.status(200).json({ liked: true });
        } else {
            return res.status(200).json({ liked: false });
        }
    } catch (err) {
        console.log("error likes check", err);
        return res.status(500).json({
            msg: "ไม่สามารถตรวจสอบสถานะไลค์ได้",
            error: err.message
        });
    }
}

// ยกเลิกไลค์โพสต์
exports.unlike = async (req, res) => {
    const { id_event, id_user } = req.params;
    try {
        const [result] = await db.promise().query("DELETE FROM like_event WHERE id_event = ? AND id_user = ?", [id_event, id_user]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                msg: "ไม่พบข้อมูลไลค์หรือยังไม่ได้ไลค์โพสต์นี้",
                error: "ไม่พบข้อมูลไลค์หรือยังไม่ได้ไลค์โพสต์นี้"
            });
        }
        return res.status(200).json({
            msg: "ยกเลิกไลค์โพสต์สำเร็จ"
        });
    } catch (err) {
        console.log("error unlike post", err);
        return res.status(500).json({
            msg: "ไม่สามารถยกเลิกไลค์โพสต์ได้",
            error: err.message
        });
    }
}