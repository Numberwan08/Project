const dayjs = require("dayjs");
require("dayjs/locale/th");
dayjs.locale("th");
const getFormattedNow = () => dayjs().format("YYYY-MM-DD HH:mm:ss");
const db = require('../config/db');
const fs = require('fs');
const { log } = require("console");
const deleteImage =(path)=>{
    fs.unlink(path,(err)=>{
        if(err){
            console.error("Error deleting image:", err);
        }else{
            console.log("Image deleted successfully");
        }
    });
};

exports.delete_comment = async (req, res) => {
    try {
        const { id } = req.params;
        // ค้นหาคอมเมนต์ก่อนเพื่อจะได้ path ของภาพ
        const [rows] = await db.promise().query("SELECT images FROM comment_post WHERE id_comment = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                msg: "คอมเมนต์ไม่พบ",
                error: "คอมเมนต์ไม่พบ"
            });
        }
        // ลบไฟล์ภาพถ้ามี
        const imagePath = rows[0].images;
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }
        // ลบคอมเมนต์ในฐานข้อมูล
        const [result] = await db.promise().query("DELETE FROM comment_post WHERE id_comment = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถลบคอมเมนต์ได้",
                error: "ไม่สามารถลบคอมเมนต์ได้"
            });
        }
        return res.status(200).json({
            msg: "ลบคอมเมนต์สำเร็จ"
        });
    } catch (err) {
        console.log("error delete comment", err);
        return res.status(500).json({
            msg: "ไม่สามารถลบคอมเมนต์ได้",
            error: err.message
        });
    }
}


exports.get_post = async (req ,res ) => {
    try{
        const [rows] = await db.promise().query(`SELECT 
                                COUNT(DISTINCT t2.id_post) AS likes,
                                COUNT(DISTINCT t4.id_comment) AS comments,
                                ROUND(LEAST(AVG(t4.star), 5), 2) AS star,
                                t1.*,
                                t3.*
                            FROM user_post t1
                            LEFT JOIN like_post t2 ON t1.id_post = t2.id_post
                            LEFT JOIN user t3 ON t1.id_user = t3.id_user
                            LEFT JOIN comment_post t4 ON t1.id_post = t4.id_post
                            GROUP BY t1.id_post;
                            `);
        if(rows.length === 0){
            return res.status(404).json({ mag: "ไม่พบโพสต์"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});


    }catch(err){
        console.log("error get post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error: err.message
        });
    }
}

exports.count_comment = async (req ,res ) => {
    
    try{
        const {id_post} = req.params;
        const [rows] = await db.promise().query(`SELECT COUNT(t2.id_post)comment  FROM user_post t1 JOIN comment_post t2 ON t1.id_post=t2.id_post WHERE t1.id_post = ?`,[id_post]);
        if(rows.length === 0){
            return res.status(404).json({ mag: "ไม่พบคอมเมนต์"});
        }
        
        return res.status(200).json({mag: "ดึงข้อมูลคอมเมนต์สำเร็จ", data: rows[0].comment_count});
        
    }catch(err){
        console.log("error get comment count", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลคอมเมนต์ได้",
            error: err.message
        });
    }
}

exports.get_comment = async (req ,res ) => {

    try{
        const {id_post} = req.params;
        const [rows] = await db.promise().query(`SELECT t3.*,t1.*,t2.* FROM user_post t1 
            JOIN comment_post t2 on t1.id_post=t2.id_post 
            JOIN user t3 on t3.id_user=t1.id_user 
            WHERE t1.id_post = ?`,[id_post]);
        if(rows.length === 0){
            return res.status(404).json({ mag: "ไม่พบคอมเมนต์"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
            user_image: row.user_image ? `${req.protocol}://${req.headers.host}/${row.user_image}`: null,
        }));

        return res.status(200).json({mag: "ดึงข้อมูลคอมเมนต์สำเร็จ", data: formatData});
        
    }catch(err){
        console.log("error get comment", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลคอมเมนต์ได้",
            error: err.message
        });
    }
}

exports.post_att = async (req ,res ) => {
    try{
        const {id} = req.params;

        const [rows] = await db.promise().query(`SELECT t1.id_post,t1.name_location,t1.detail_location,t1.phone,t1.detail_att,t1.date,t1.images,t1.latitude,t1.longitude,t2.first_name,
            count(t3.id_post) likes,
            ROUND(LEAST(AVG(t4.star), 5), 2) AS star
            FROM user_post t1 
            JOIN user t2 ON t1.id_user = t2.id_user
            JOIN like_post t3 ON t1.id_post = t3.id_post
            JOIN comment_post t4 ON t1.id_post = t4.id_post
            WHERE t1.id_post= ?
            `,[id]);

        if(rows.length === 0){
            return res.status(404).json({ mag: "ไม่พบโพสต์"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});


    }catch(err){
        console.log("error get post", err);
        return res.status(500).json({
            mag: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error: err.message
        });
    }
}

exports.get_post_me = async (req ,res ) => {
    const {id} =req.params;
    try{
        const [rows] = await db.promise().query("SELECT * FROM user_post WHERE id_user = ?",[id]);

        if(rows.length === 0){
            return res.status(404).json({ mag: "ไม่พบโพสต์"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});


    }catch(err){
        console.log("error get post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error: err.message
        });
    }
}


exports.add_post = async (req, res) => {
  const {
    id_user,
    name_location,
    detail_location,
    phone,
    detail_att,
    latitude,
    longitude,
    date,
    type
  } = req.body;

  const image = req.file;
  const postDate = date || new Date().toISOString();

  try {
    const [[{max_id}]] = await db.promise().query("SELECT MAX(id_post) as max_id FROM user_post ")
    const [rows] = await db
      .promise()
      .query(
        "INSERT INTO user_post (id_post,id_user, name_location, detail_location, phone, detail_att, images, latitude, longitude ,date,type) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
            max_id+1,
          id_user,
          name_location,
          detail_location,
          phone,
          detail_att,
          image.path,
          latitude,
          longitude,
          postDate,
          type
        ]
      );

    if (rows.affectedRows === 0) {
      deleteImage(image.path);
      return res.status(400).json({
        msg: "ไม่สามารถโพสต์ได้",
        error: "ไม่สามารถโพสต์ได้",
      });
    }

    return res.status(201).json({ msg: "add post sucess" });
  } catch (err) {
    deleteImage(image.path);
    console.log("error user_post", err);
    return res.status(500).json({
      msg: "ไม่สามารถโพสต์ได้",
      error: err.message,
    });
  }
};



exports.edit_post = async (req, res) => {
    
    const { id } = req.params;
    let {
        name_location,
        detail_location,
        phone,
        detail_att,
        latitude,
        longitude
    } = req.body;

    try {
        let imagePath = null;
        // ถ้ามีการอัปโหลดไฟล์ใหม่
        if (req.file) {
            imagePath = req.file.path;

            // ลบรูปเดิม (ถ้ามี)
            const [oldRows] = await db.promise().query("SELECT images FROM user_post WHERE id_post = ?", [id]);
            if (oldRows.length > 0 && oldRows[0].images && fs.existsSync(oldRows[0].images)) {
                deleteImage(oldRows[0].images);
            }
        }

        // ถ้าไม่ได้อัปโหลดรูปใหม่ ให้ใช้ path เดิม
        if (!imagePath) {
            const [oldRows] = await db.promise().query("SELECT images FROM user_post WHERE id_post = ?", [id]);
            imagePath = oldRows.length > 0 ? oldRows[0].images : null;
        }

        const [rows] = await db.promise().query(
            "UPDATE user_post SET name_location = ?, detail_location = ?, phone = ?, detail_att = ?, images = ?, latitude = ?, longitude = ? WHERE id_post = ?",
            [
                name_location,
                detail_location,
                phone,
                detail_att,
                imagePath,
                latitude,
                longitude,
                id
            ]
        );

        if (rows.affectedRows === 0) {
            return res.status(404).json({
                msg: "โพสต์ไม่พบ",
                error: "โพสต์ไม่พบ"
            });
        }

        return res.status(200).json({
            msg: "แก้ไขโพสต์สำเร็จ"
        });

    } catch (err) {
        console.log("error edit user_post", err);
        return res.status(500).json({
            msg: "ไม่สามารถแก้ไขโพสต์ได้",
            error: err.message
        });
    }
}

exports.delete_post = async (req, res) => {
    try {
        const { id } = req.params;

        // ค้นหาโพสต์ก่อนเพื่อจะได้ path ของภาพ
        const [rows] = await db.promise().query("SELECT * FROM user_post WHERE id_post = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                msg: "โพสต์ไม่พบ",
                error: "โพสต์ไม่พบ"
            });
        }

        // ลบไฟล์ภาพถ้ามี
        const imagePath = rows[0].images;
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }

        // ลบโพสต์ในฐานข้อมูล
        const [result] = await db.promise().query("DELETE FROM user_post WHERE id_post = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถลบโพสต์ได้",
                error: "ไม่สามารถลบโพสต์ได้"
            });
        }
        return res.status(200).json({
            msg: "ลบโพสต์สำเร็จ"
        });

    } catch (err) {
        console.log("error delete user_post", err);
        return res.status(500).json({
            msg: "ไม่สามารถลบโพสต์ได้",
            error: err.message
        });
    }
}

exports.likes = async (req, res) => {
    const {id} = req.params;
    const {userId} = req.body;
    try{
        const [existingLike] = await db.promise().query("SELECT * FROM like_post WHERE id_post = ? AND id_user = ?", [id, userId]);
        if(existingLike.length > 0){
            return res.status(400).json({
                msg: "คุณได้กดไลค์โพสต์นี้แล้ว",
                error: "คุณได้กดไลค์โพสต์นี้แล้ว"
            });
        }
        const [rows] = await db.promise().query("INSERT INTO like_post (id_post,id_user) VALUES (?,?)",[id, userId]);
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
}

// เช็คสถานะไลค์ของ user กับ post
exports.likes_check = async (req, res) => {
    const { id_post, id_user } = req.params;
    try {
        const [rows] = await db.promise().query("SELECT * FROM like_post WHERE id_post = ? AND id_user = ?", [id_post, id_user]);
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
    const { id_post, id_user } = req.params;
    try {
        const [result] = await db.promise().query("DELETE FROM like_post WHERE id_post = ? AND id_user = ?", [id_post, id_user]);
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

exports.nearby = async (req, res) => {
    const { id } = req.params;
    try {

        const [[current]] = await db.promise().query("SELECT latitude, longitude FROM user_post WHERE id_post = ?", [id]);
        if (!current || !current.latitude || !current.longitude) {
            return res.status(404).json({ msg: "ไม่พบข้อมูลสถานที่หลัก" });
        }
        // ดึงข้อมูลสถานที่อื่น ๆ ทั้งหมด (ยกเว้นตัวเอง)
        const [places] = await db.promise().query("SELECT id_post, name_location, detail_location, latitude, longitude, images FROM user_post WHERE id_post != ? AND latitude IS NOT NULL AND longitude IS NOT NULL", [id]);
        // คำนวณระยะทาง
        function toRad(Value) { return (Value * Math.PI) / 180; }
        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }
        const nearby = places.map(place => ({
            ...place,
            distance: getDistance(
                parseFloat(current.latitude),
                parseFloat(current.longitude),
                parseFloat(place.latitude),
                parseFloat(place.longitude)
            )
        })).sort((a, b) => a.distance - b.distance).slice(0, 3);
        return res.status(200).json({ data: nearby });
    } catch (err) {
        console.log("error nearby", err);
        return res.status(500).json({ msg: "ไม่สามารถดึงสถานที่ใกล้เคียงได้", error: err.message });
    }
}

exports.comment_post = async (req, res) => {
    const {id_post} = req.params;
    const {id_comment,userId, star, comment} = req.body;
    const image = req.file;
    
    

    try{
        const [rows] =await db.promise().query(`INSERT INTO comment_post (id_comment,id_post,id_user,date_comment,images,star,comment) VALUES (?,?,?,?,?,?,?)`
                                                ,[id_comment,id_post,userId,getFormattedNow(),image.path,star,comment]);
        if(rows.affectedRows === 0){
            if(image && image.path){
                deleteImage(image.path);
            }
            return res.status(400).json({
                msg: "ไม่สามารถคอมเมนต์โพสต์ได้",
                error: "ไม่สามารถคอมเมนต์โพสต์ได้"
            });
        }

        return res.status(200).json({
            msg: "คอมเมนต์โพสต์สำเร็จ"
        });

    }catch(err){
        console.log("error comment post", err);
        return res.status(500).json({
            msg: "ไม่สามารถคอมเมนต์โพสต์ได้",
            error: err.message
        });
    }

}