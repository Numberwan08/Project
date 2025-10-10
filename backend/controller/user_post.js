const dayjs = require("dayjs");
require("dayjs/locale/th");
dayjs.locale("th");
const getFormattedNow = () => dayjs().format("YYYY-MM-DD HH:mm:ss");
const db = require('../config/db');
const fs = require('fs');
const { log } = require("console");
const commentController = require('./comment');
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
        const [rows] = await db.promise().query("SELECT images FROM comment_post WHERE id_comment = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                msg: "คอมเมนต์ไม่พบ",
                error: "คอมเมนต์ไม่พบ"
            });
        }
        const imagePath = rows[0].images;
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }
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
        const sql = `SELECT 
        p.*,
        pt.id_type,
        pt.name_type,
        COALESCE(l.likes, 0) AS likes,
        COALESCE(c.comments, 0) AS comments,
        COALESCE(c.avg_star, 0) AS star,
        COALESCE(pr.products, 0) AS products
    FROM user_post p
    LEFT JOIN (
        SELECT id_post, COUNT(*) AS likes
        FROM like_post
        GROUP BY id_post
    ) l ON p.id_post = l.id_post
    LEFT JOIN (
        SELECT id_post, COUNT(*) AS comments, ROUND(LEAST(AVG(star), 5), 2) AS avg_star
        FROM comment_post
        WHERE status IS NULL OR status <> '0'
        GROUP BY id_post
    ) c ON p.id_post = c.id_post
                    `;

        const [rows] = await db.promise().query(sql);
        
        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

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
        const [rows] = await db.promise().query(`SELECT COUNT(t2.id_post)comment  FROM user_post t1 JOIN comment_post t2 ON 
            t1.id_post=t2.id_post WHERE t1.id_post = ?`,[id_post]);
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


        const [rows] = await db.promise().query(`
            SELECT 
                t3.*,
                t1.*,
                t2.*,
                COALESCE(cr.replies_count, 0) AS replies_count
            FROM user_post t1
            JOIN comment_post t2 ON t1.id_post = t2.id_post
            JOIN user t3 ON t3.id_user = t2.id_user
            LEFT JOIN (
                SELECT id_comment, COUNT(*) AS replies_count
                FROM comment_reply
                WHERE status IS NULL OR status <> '0'
                GROUP BY id_comment
            ) cr ON cr.id_comment = t2.id_comment
            WHERE t1.id_post = ?
              AND (t2.status IS NULL OR t2.status <> '0')
            ORDER BY t2.date_comment DESC
        `,[id_post]);

        if(rows.length === 0){
            return res.status(200).json({ msg: "ดึงข้อมูลคอมเมนต์สำเร็จ", data: []});
        }

        const formatData = rows.map((row)=>({
            ...row,
            replies_count: row.replies_count || 0,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
            // ใช้รูปโปรไฟล์จากตาราง user (image_profile) เป็น avatar ของผู้คอมเมนต์
            user_image: row.image_profile ? `${req.protocol}://${req.headers.host}/${row.image_profile}`: null,
        }));

        return res.status(200).json({msg: "ดึงข้อมูลคอมเมนต์สำเร็จ", data: formatData});
        
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

        const [rows] = await db.promise().query(`SELECT 
    t1.id_post,
    t1.name_location,
    t1.detail_location,
    t1.phone,
    t1.detail_att,
    t1.date,
    t1.images,
    t1.latitude,
    t1.longitude,
    'Admin' as first_name,
    COALESCE(l.like_count, 0) AS likes,
    COALESCE(c.avg_star, 0) AS star
FROM user_post t1

LEFT JOIN (
    SELECT id_post, COUNT(*) AS like_count
    FROM like_post
    GROUP BY id_post
) l ON t1.id_post = l.id_post

LEFT JOIN (
    SELECT id_post, ROUND(LEAST(AVG(star), 5), 2) AS avg_star
    FROM comment_post
    WHERE status IS NULL OR status <> '0'
    GROUP BY id_post
) c ON t1.id_post = c.id_post

WHERE t1.id_post = ?`,[id]);

        if(rows.length === 0){
            return res.status(200).json({ msg: "ไม่พบโพสต์", data: []});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});


    }catch(err){
        console.log("error get post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error: err.message
        });
    }
}

exports.get_single_post = async (req, res) => {
    const {id} = req.params;
    try{
        const sql = `
            SELECT 
                p.*,
                COALESCE(l.likes, 0) AS likes,
                COALESCE(c.comments, 0) AS comments,
                COALESCE(c.avg_star, 0) AS star
            FROM user_post p
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS likes
                FROM like_post
                GROUP BY id_post
            ) l ON p.id_post = l.id_post
            LEFT JOIN (
                SELECT cp.id_post,
                       (COUNT(cp.id_comment)) + COALESCE(rp.replies, 0) AS comments,
                       ROUND(LEAST(AVG(cp.star), 5), 2) AS avg_star
                FROM comment_post cp
                LEFT JOIN (
                    SELECT t2.id_post, COUNT(*) AS replies
                    FROM comment_reply r
                    JOIN comment_post t2 ON t2.id_comment = r.id_comment
                    WHERE r.status IS NULL OR r.status <> '0'
                    GROUP BY t2.id_post
                ) rp ON rp.id_post = cp.id_post
                WHERE cp.status IS NULL OR cp.status <> '0'
                GROUP BY cp.id_post
            ) c ON p.id_post = c.id_post
            WHERE p.id_post = ?
        `;
        const [rows] = await db.promise().query(sql, [id]);

        if(rows.length === 0){
            return res.status(404).json({ msg: "ไม่พบโพสต์"});
        }

        const formatData = {
            ...rows[0],
            images: rows[0].images ? `${req.protocol}://${req.headers.host}/${rows[0].images}`: null,
        };

        return res.status(200).json({msg: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

    }catch(err){
        console.log("error get single post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error: err.message
        });
    }
}

exports.get_post_me = async (req ,res ) => {
    const {id} =req.params;
    try{
        const sql = `
            SELECT 
                p.*,
                COALESCE(l.likes, 0) AS likes,
                COALESCE(c.comments, 0) AS comments,
                COALESCE(c.avg_star, 0) AS star
            FROM user_post p
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS likes
                FROM like_post
                GROUP BY id_post
            ) l ON p.id_post = l.id_post
            LEFT JOIN (
                SELECT cp.id_post,
                       (COUNT(cp.id_comment)) + COALESCE(rp.replies, 0) AS comments,
                       ROUND(LEAST(AVG(cp.star), 5), 2) AS avg_star
                FROM comment_post cp
                LEFT JOIN (
                    SELECT t2.id_post, COUNT(*) AS replies
                    FROM comment_reply r
                    JOIN comment_post t2 ON t2.id_comment = r.id_comment
                    WHERE r.status IS NULL OR r.status <> '0'
                    GROUP BY t2.id_post
                ) rp ON rp.id_post = cp.id_post
                WHERE cp.status IS NULL OR cp.status <> '0'
                GROUP BY cp.id_post
            ) c ON p.id_post = c.id_post
            WHERE p.id_user = ?
            ORDER BY p.date DESC
        `;
        const [rows] = await db.promise().query(sql, [id]);

        if(rows.length === 0){
            return res.status(404).json({ msg: "ไม่พบโพสต์"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

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
    name_location,
    detail_location,
    phone,
    detail_att,
    latitude,
    longitude,
    date,
    type,
    id_type
  } = req.body;

  const image = req.file;
  const postDate = date || new Date().toISOString();

  try {
    if (!image) {
      return res.status(400).json({
        msg: "กรุณาเลือกรูปภาพ",
        error: "กรุณาเลือกรูปภาพ",
      });
    }

    const [rows] = await db
      .promise()
      .query(
        "INSERT INTO user_post (name_location, detail_location, phone, detail_att, images, latitude, longitude, date, type, id_type) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
          name_location,
          detail_location,
          phone,
          detail_att,
          image.path,
          latitude,
          longitude,
          postDate,
          type || 1,
          id_type,
        ]
      );

    if (rows.affectedRows === 0) {
      deleteImage(image.path);
      return res.status(400).json({
        msg: "ไม่สามารถโพสต์ได้",
        error: "ไม่สามารถโพสต์ได้",
      });
    }

    return res.status(201).json({ msg: "เพิ่มโพสต์สำเร็จ" });
  } catch (err) {
    if (image && image.path) {
      deleteImage(image.path);
    }
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
        longitude,
        id_type
    } = req.body;

    try {
        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path;

            const [oldRows] = await db.promise().query("SELECT images FROM user_post WHERE id_post = ?", [id]);
            if (oldRows.length > 0 && oldRows[0].images && fs.existsSync(oldRows[0].images)) {
                deleteImage(oldRows[0].images);
            }
        }

        if (!imagePath) {
            const [oldRows] = await db.promise().query("SELECT images FROM user_post WHERE id_post = ?", [id]);
            imagePath = oldRows.length > 0 ? oldRows[0].images : null;
        }

        const [rows] = await db.promise().query(
            `UPDATE user_post 
             SET name_location = ?, 
                 detail_location = ?, 
                 phone = ?, 
                 detail_att = ?, 
                 images = ?, 
                 latitude = ?, 
                 longitude = ?, 
                 id_type = ?
             WHERE id_post = ?`,
            [
              name_location,
              detail_location,
              phone,
              detail_att,
              imagePath,
              latitude,
              longitude,
              id_type,
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
        const [rows] = await db.promise().query("SELECT * FROM user_post WHERE id_post = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                msg: "โพสต์ไม่พบ",
                error: "โพสต์ไม่พบ"
            });
        }

        const imagePath = rows[0].images;
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }

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
            return res.status(200).json({ msg: "ไม่พบข้อมูลสถานที่หลัก", data: [] });
        }
        const [places] = await db.promise().query("SELECT id_post, name_location, detail_location, latitude, longitude, images FROM user_post WHERE id_post != ? AND latitude IS NOT NULL AND longitude IS NOT NULL", [id]);

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

// PATCH /api/post/comment_status/:id_comment { status: 0|1 }
exports.set_comment_status = async (req, res) => {
    try {
        const { id_comment } = req.params;
        let { status } = req.body || {};
        if (!id_comment) {
            return res.status(400).json({ msg: 'ต้องระบุ id_comment' });
        }
        status = Number(status);
        if (status !== 0 && status !== 1) {
            return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง ต้องเป็น 0 หรือ 1' });
        }
        const [chk] = await db.promise().query('SELECT id_comment FROM comment_post WHERE id_comment = ?', [id_comment]);
        if (chk.length === 0) return res.status(404).json({ msg: 'ไม่พบความคิดเห็น' });
        await db.promise().query('UPDATE comment_post SET status = ? WHERE id_comment = ?', [String(status), id_comment]);
        return res.status(200).json({ msg: 'อัปเดตสถานะความคิดเห็นสำเร็จ' });
    } catch (err) {
        console.log('set_comment_status error', err);
        return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะความคิดเห็นได้', error: err.message });
    }
};

// Get single comment status by id_comment
exports.get_comment_status = async (req, res) => {
    try {
        const { id_comment } = req.params;
        if (!id_comment) {
            return res.status(400).json({ msg: "ต้องระบุ id_comment", error: "id_comment required" });
        }
        const [rows] = await db.promise().query(
            "SELECT id_comment, id_post, status FROM comment_post WHERE id_comment = ?",
            [id_comment]
        );
        if (rows.length === 0) {
            return res.status(404).json({ msg: "ไม่พบความคิดเห็น" });
        }
        return res.status(200).json({ msg: "ดึงสถานะความคิดเห็นสำเร็จ", data: rows[0] });
    } catch (err) {
        console.log("error get comment status", err);
        return res.status(500).json({ msg: "ไม่สามารถดึงสถานะความคิดเห็นได้", error: err.message });
    }
};

// แก้ไขคอมเมนต์ของตนเอง
exports.edit_comment = async (req, res) => {
    try {
        const { id } = req.params; // id_comment
        const { id_user, comment, star, remove_image } = req.body;

        if (!id || !id_user) {
            return res.status(400).json({ msg: "ข้อมูลไม่ครบถ้วน", error: "ต้องระบุ id และ id_user" });
        }

        const [rows] = await db.promise().query("SELECT * FROM comment_post WHERE id_comment = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: "ไม่พบความคิดเห็น", error: "ไม่พบความคิดเห็น" });
        }

        const cm = rows[0];
        if (String(cm.id_user) !== String(id_user)) {
            return res.status(403).json({ msg: "ไม่มีสิทธิ์แก้ไขความคิดเห็นนี้", error: "forbidden" });
        }

        let imagePath = cm.images || null;
        // หากอัปโหลดรูปใหม่ ให้ลบรูปเดิม
        if (req.file && req.file.path) {
            if (imagePath && fs.existsSync(imagePath)) {
                deleteImage(imagePath);
            }
            imagePath = req.file.path;
        } else if (remove_image === '1' || remove_image === 'true') {
            if (imagePath && fs.existsSync(imagePath)) {
                deleteImage(imagePath);
            }
            imagePath = null;
        }

        const newComment = typeof comment === 'string' ? comment : cm.comment;
        const newStar = (star !== undefined && star !== null && star !== '') ? star : cm.star;

        const [result] = await db.promise().query(
            "UPDATE comment_post SET comment = ?, star = ?, images = ? WHERE id_comment = ?",
            [newComment, newStar, imagePath, id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ msg: "ไม่สามารถแก้ไขความคิดเห็นได้", error: "update failed" });
        }

        const [updatedRows] = await db.promise().query("SELECT * FROM comment_post WHERE id_comment = ?", [id]);
        const updated = updatedRows[0];

        return res.status(200).json({
            msg: "แก้ไขความคิดเห็นสำเร็จ",
            data: {
                ...updated,
                images: updated.images ? `${req.protocol}://${req.headers.host}/${updated.images}` : null
            }
        });
    } catch (err) {
        console.log("error edit comment", err);
        // ลบไฟล์ใหม่ที่อัปโหลดแล้วหากเกิดข้อผิดพลาด
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(500).json({ msg: "ไม่สามารถแก้ไขความคิดเห็นได้", error: err.message });
    }
}

// Add: get list of post types
exports.get_post_types = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`SELECT id_type, name_type FROM post_type ORDER BY id_type`);
        return res.status(200).json({ msg: "ดึงประเภทโพสต์สำเร็จ", data: rows });
    } catch (err) {
        console.log("error get post types", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงประเภทโพสต์ได้",
            error: err.message
        });
    }
};

// Add: create a new post type
exports.create_post_type = async (req, res) => {
    try {
        const { name_type } = req.body;
        if (!name_type || name_type.toString().trim() === "") {
            return res.status(400).json({ msg: "กรุณาระบุชื่อประเภท", error: "name_type required" });
        }
        const [result] = await db.promise().query("INSERT INTO post_type (name_type) VALUES (?)", [name_type]);
        if (result.affectedRows === 0) {
            return res.status(400).json({ msg: "ไม่สามารถสร้างประเภทได้", error: "insert failed" });
        }
        return res.status(201).json({ msg: "สร้างประเภทสำเร็จ", data: { id_type: result.insertId, name_type } });
    } catch (err) {
        console.log("error create post type", err);
        return res.status(500).json({
            msg: "ไม่สามารถสร้างประเภทได้",
            error: err.message
        });
    }
};

// Update a post type
exports.update_post_type = async (req, res) => {
    try {
        const { id } = req.params;
        const { name_type } = req.body;
        if (!name_type || name_type.toString().trim() === "") {
            return res.status(400).json({ msg: "กรุณาระบุชื่อประเภท", error: "name_type required" });
        }
        const [result] = await db.promise().query(
            "UPDATE post_type SET name_type = ? WHERE id_type = ?",
            [name_type, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "ไม่พบประเภทที่ต้องการแก้ไข" });
        }
        return res.status(200).json({ msg: "แก้ไขประเภทสำเร็จ", data: { id_type: Number(id), name_type } });
    } catch (err) {
        console.log("error update post type", err);
        return res.status(500).json({ msg: "ไม่สามารถแก้ไขประเภทได้", error: err.message });
    }
};

// Delete a post type
exports.delete_post_type = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.promise().query(
            "DELETE FROM post_type WHERE id_type = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "ไม่พบประเภทที่ต้องการลบ" });
        }
        return res.status(200).json({ msg: "ลบประเภทสำเร็จ" });
    } catch (err) {
        // Handle MySQL foreign key constraint
        if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451)) {
            return res.status(409).json({ msg: "ไม่สามารถลบประเภทได้ เนื่องจากถูกใช้งานอยู่", error: err.message });
        }
        console.log("error delete post type", err);
        return res.status(500).json({ msg: "ไม่สามารถลบประเภทได้", error: err.message });
    }
};

exports.get_type_name = async (req, res) => {
    try{
        const [rows] = await db.promise().query("SELECT name_type FROM post_type");
        return res.status(200).json({ msg: "ดึงชื่อประเภทสำเร็จ", data: rows });
    }catch(err){
        console.log("error get type name", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงชื่อประเภทได้",
            error: err.message
        });
    }
}

exports.add_reply = commentController.add_reply;
exports.get_replies = commentController.get_replies;
