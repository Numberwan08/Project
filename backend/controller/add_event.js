
const db = require("../config/db");
const fs = require('fs');

// Normalize various date-time inputs to MySQL DATETIME 'YYYY-MM-DD HH:mm:ss'
const toMysqlDatetime = (val) => {
  try {
    if (!val) return null;
    // Handle strings like '2025-05-29T10:00' or ISO '...Z'
    let d = new Date(val);
    if (isNaN(d.getTime())) {
      // Fallback: simple replacements
      let s = String(val).replace('T', ' ').replace('Z', '');
      // Append seconds if missing
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) s += ':00';
      // Remove milliseconds and timezone offset if any
      s = s.replace(/\.\d+$/, '');
      // If still invalid, return null
      d = new Date(s);
      if (isNaN(d.getTime())) return null;
    }
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  } catch (_) {
    return null;
  }
};

// Ensure user_event has expected columns used by code (e.g., id_user)
const ensureUserEventTable = async () => {
  const addCol = async (sql) => {
    try { await db.promise().query(sql); } catch (_) {}
  };
  await addCol("ALTER TABLE user_event ADD COLUMN id_user INT NULL");
};
const deleteImage =(path)=>{
    fs.unlink(path,(err)=>{
        if(err){
            console.error("Error deleting image:", err);
        }else{
            console.log("Image deleted successfully");
        }
    });
};

// Helpers for cascade cleanup of event comments/images
let _hasEventImagesColCache = null;
const hasEventImagesColumn = async () => {
  if (_hasEventImagesColCache !== null) return _hasEventImagesColCache;
  try {
    const [cols] = await db.promise().query("SHOW COLUMNS FROM event_comment LIKE 'id_images_event'");
    _hasEventImagesColCache = Array.isArray(cols) && cols.length > 0;
  } catch (_) {
    _hasEventImagesColCache = false;
  }
  return _hasEventImagesColCache;
};

const deleteEventImagesGroup = async (groupId) => {
  if (!groupId) return;
  try {
    const [rows] = await db
      .promise()
      .query('SELECT images FROM images WHERE id_images_event = ?', [groupId]);
    for (const r of rows) {
      const p = r?.images;
      if (p && fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch(_) {}
      }
    }
    await db.promise().query('DELETE FROM images WHERE id_images_event = ?', [groupId]);
  } catch (_) {}
};


exports.get_event = async (req , res )=> {
    try{
        await ensureUserEventTable();
        const [rows] = await db.promise().query(`SELECT COUNT(t2.id_event) likes,t1.*,t3.first_name FROM user_event t1
LEFT JOIN like_event t2 on t1.id_event=t2.id_event
LEFT JOIN user t3 on t1.id_user=t3.id_user
GROUP BY t1.id_event`);
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
        await ensureUserEventTable();
        const [rows] = await db.promise().query(`SELECT 
            t1.id_event,
            t1.name_event,
            t1.location_event,
            t1.phone,
            t1.detail_event,
            t1.date_start,
            t1.images,
            t1.latitude,
            t1.longitude,
            t1.date_end,
            t2.first_name,
            COUNT(t3.id_event) AS likes
          FROM user_event t1
          LEFT JOIN user t2 ON t1.id_user = t2.id_user 
          LEFT JOIN like_event t3 ON t1.id_event = t3.id_event
          WHERE t1.id_event = ?
          GROUP BY t1.id_event`,[id]);
    
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
        await ensureUserEventTable();

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
    await ensureUserEventTable();
    const [[{max_id}]] = await db.promise().query("SELECT MAX(id_event) as max_id FROM user_event ")

    // console.log("req.bady",req.bady);
        const {
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
        // Validate and enforce unique name_event (trimmed)
        const trimmedName = (name_event || "").replace(/\s+/g, " ").trim();
        if (!trimmedName) {
            if (image && image.path && fs.existsSync(image.path)) deleteImage(image.path);
            return res.status(400).json({ mag: "กรุณาระบุชื่อกิจกรรม", error: "name_event required" });
        }
        const [dup] = await db.promise().query(
            "SELECT id_event FROM user_event WHERE name_event = ?",
            [trimmedName]
        );
        if (dup.length > 0) {
            if (image && image.path && fs.existsSync(image.path)) deleteImage(image.path);
            return res.status(400).json({ mag: "ชื่องานนี้ถูกใช้ไปแล้ว", error: "duplicate name_event" });
        }
        const id_user_insert = (req.body && req.body.id_user) ? req.body.id_user : null;
        const startAt = toMysqlDatetime(date_start);
        const endAt = toMysqlDatetime(date_end);
        const [rows]=await db.promise().query("INSERT INTO user_event (id_event,id_user, name_event, location_event, phone, detail_event, date_start, date_end, images, latitude, longitude, type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",[
            max_id+1,
            id_user_insert,
            trimmedName,
            location_event,
            phone,
            detail_event,
            startAt,
            endAt,
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
    await ensureUserEventTable();
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
        // Uniqueness check for name_event (exclude current id)
        const trimmedName = (name_event || "").replace(/\s+/g, " ").trim();
        if (!trimmedName) {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) deleteImage(req.file.path);
            return res.status(400).json({ mag: "กรุณาระบุชื่อกิจกรรม", error: "name_event required" });
        }
        const [dup] = await db.promise().query(
            "SELECT id_event FROM user_event WHERE name_event = ? AND id_event <> ?",
            [trimmedName, id]
        );
        if (dup.length > 0) {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) deleteImage(req.file.path);
            return res.status(400).json({ mag: "ชื่องานนี้ถูกใช้ไปแล้ว", error: "duplicate name_event" });
        }
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

        const startAt = toMysqlDatetime(date_start);
        const endAt = toMysqlDatetime(date_end);
        const [rows] = await db.promise().query(
            "UPDATE user_event SET name_event = ?, location_event = ?, phone = ?, detail_event = ?, date_start = ?, date_end = ?, images = ?, latitude = ?, longitude = ?, type = ? WHERE id_event = ?",
            [
                trimmedName,
                location_event,
                phone,
                detail_event,
                startAt,
                endAt,
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
       await ensureUserEventTable();
       
        const {id} = req.params;

        const [rows] =await db.promise().query("SELECT * FROM user_event WHERE id_event = ?",[id]);

        if(rows.length === 0){
            return res.status(404).json({
                mag: "ไม่พบกิจกรรมที่ต้องการลบ",
                error: "ไม่พบกิจกรรมที่ต้องการลบ"
            })
        }

        // ลบคอมเมนต์ / ตอบกลับ / ไลค์ ที่เกี่ยวข้อง (เทียบเท่า ON DELETE CASCADE)
        try {
          const colExists = await hasEventImagesColumn();
          // รวบรวมคอมเมนต์ของอีเวนต์นี้
          let comments = [];
          if (colExists) {
            const [cm] = await db
              .promise()
              .query('SELECT id_comment, images, id_images_event FROM event_comment WHERE id_event = ?', [id]);
            comments = cm || [];
          } else {
            const [cm] = await db
              .promise()
              .query('SELECT id_comment, images FROM event_comment WHERE id_event = ?', [id]);
            comments = cm || [];
          }
          // ลบไฟล์รูปคอมเมนต์ + ชุดรูป
          for (const c of comments) {
            if (c?.images && fs.existsSync(c.images)) {
              try { fs.unlinkSync(c.images); } catch(_) {}
            }
            if (c?.id_images_event) {
              await deleteEventImagesGroup(c.id_images_event);
            }
          }
          // ลบ replies ก่อน (ไม่มี FK CASCADE)
          if (comments.length > 0) {
            const ids = comments.map(c => c.id_comment);
            const placeholders = ids.map(()=> '?').join(',');
            await db.promise().query(`DELETE FROM event_comment_reply WHERE id_comment IN (${placeholders})`, ids);
          }
          // ลบ comments
          await db.promise().query('DELETE FROM event_comment WHERE id_event = ?', [id]);
          // ลบไลค์ของอีเวนต์
          await db.promise().query('DELETE FROM like_event WHERE id_event = ?', [id]);
          // ลบรายงานที่เกี่ยวข้องกับอีเวนต์ (ถ้ามีตารางนี้)
          try {
            await db.promise().query('DELETE FROM report_comment WHERE id_event = ?', [id]);
          } catch(_) {}
        } catch(_) { /* best effort */ }

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

exports.nearby_event = async (req, res) => {
    const { id } = req.params;
    try {
        
        const [[current]] = await db.promise().query("SELECT latitude, longitude FROM user_event WHERE id_event = ?", [id]);
        if (!current || !current.latitude || !current.longitude) {
            return res.status(404).json({ msg: "ไม่พบข้อมูลสถานที่หลัก" });
        }
        // ดึงข้อมูลสถานที่อื่น ๆ ทั้งหมด (ยกเว้นตัวเอง)
        const [places] = await db.promise().query("SELECT id_event, name_event, detail_event, latitude, longitude, images FROM user_event WHERE id_event != ? AND latitude IS NOT NULL AND longitude IS NOT NULL", [id]);
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
