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
        await ensureCommentImagesSupport();
        let rows;
        try {
            [rows] = await db
                .promise()
                .query("SELECT images, id_images_post FROM comment_post WHERE id_comment = ?", [id]);
        } catch (_) {
            [rows] = await db
                .promise()
                .query("SELECT images FROM comment_post WHERE id_comment = ?", [id]);
        }
        if (rows.length === 0) {
            return res.status(404).json({
                msg: "คอมเมนต์ไม่พบ",
                error: "คอมเมนต์ไม่พบ"
            });
        }
        const imagePath = rows[0].images;
        const groupId = rows[0].id_images_post ? rows[0].id_images_post : null;
        // delete single image path if existed
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }
        // delete images group if existed
        if (groupId) {
            await deleteImagesGroup(groupId);
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
        const sql = `
            SELECT 
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
                SELECT cp.id_post,
                       (COUNT(cp.id_comment)) + COALESCE(MAX(rp.replies), 0) AS comments,
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
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS products
                FROM user_prodact
                GROUP BY id_post
            ) pr ON p.id_post = pr.id_post
            LEFT JOIN post_type pt ON p.id_type = pt.id_type
            ORDER BY likes DESC;
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

        // Collect all image group ids present (if column exists)
        let groups = [];
        try {
            groups = rows
                .map((r) => r.id_images_post)
                .filter((v) => v !== undefined && v !== null);
        } catch (_) {}

        let imagesByGroup = {};
        if (groups.length > 0) {
            try {
                const [imgRows] = await db
                    .promise()
                    .query(
                        `SELECT id_mages_post, images FROM images WHERE id_mages_post IN (${groups.map(()=> '?').join(',')})`,
                        groups
                    );
                for (const ir of imgRows) {
                    const gid = ir.id_mages_post;
                    if (!imagesByGroup[gid]) imagesByGroup[gid] = [];
                    imagesByGroup[gid].push(ir.images);
                }
            } catch (_) {}
        }

        const base = `${req.protocol}://${req.headers.host}/`;
        const toAbs = (p) => (p ? (p.startsWith('http') ? p : base + p) : null);

        const formatData = rows.map((row)=>{
            const list = (row.id_images_post && imagesByGroup[row.id_images_post]) ? imagesByGroup[row.id_images_post].map(toAbs) : [];
            return {
                ...row,
                replies_count: row.replies_count || 0,
                images: row.images ? toAbs(row.images) : (list[0] || null),
                images_list: list,
                // ใช้รูปโปรไฟล์จากตาราง user (image_profile) เป็น avatar ของผู้คอมเมนต์
                user_image: row.image_profile ? toAbs(row.image_profile) : null,
            };
        });

        return res.status(200).json({msg: "ดึงข้อมูลคอมเมนต์สำเร็จ", data: formatData});
        
    }catch(err){
        console.log("error get comment", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลคอมเมนต์ได้",
            error: err.message
        });
    }
}

// Get all comments by a user (places)
exports.get_my_comments = async (req, res) => {
    try {
        const { id_user } = req.params;
        if (!id_user) {
            return res.status(400).json({ msg: "ต้องระบุ id_user", error: "id_user required" });
        }
        const colExists = await hasCommentImagesColumn();
        const selectSql = colExists ? `
            SELECT 
                cp.id_comment,
                cp.id_post,
                cp.date_comment,
                cp.comment,
                cp.images,
                cp.id_images_post,
                up.name_location AS post_name,
                u.first_name AS user_name,
                u.image_profile AS user_image
            FROM comment_post cp
            JOIN user_post up ON up.id_post = cp.id_post
            JOIN user u ON u.id_user = cp.id_user
            WHERE cp.id_user = ?
              AND (cp.status IS NULL OR cp.status <> '0')
            ORDER BY cp.date_comment DESC
        ` : `
            SELECT 
                cp.id_comment,
                cp.id_post,
                cp.date_comment,
                cp.comment,
                cp.images,
                up.name_location AS post_name,
                u.first_name AS user_name,
                u.image_profile AS user_image
            FROM comment_post cp
            JOIN user_post up ON up.id_post = cp.id_post
            JOIN user u ON u.id_user = cp.id_user
            WHERE cp.id_user = ?
              AND (cp.status IS NULL OR cp.status <> '0')
            ORDER BY cp.date_comment DESC
        `;
        const [rows] = await db.promise().query(selectSql, [id_user]);
        // batch load images by group
        const groups = colExists ? rows.map(r => r.id_images_post).filter(v => v !== undefined && v !== null) : [];
        let imagesByGroup = {};
        if (groups.length > 0) {
            try {
                const [imgRows] = await db
                    .promise()
                    .query(
                        `SELECT id_mages_post, images FROM images WHERE id_mages_post IN (${groups.map(()=> '?').join(',')})`,
                        groups
                    );
                for (const ir of imgRows) {
                    const gid = ir.id_mages_post;
                    if (!imagesByGroup[gid]) imagesByGroup[gid] = [];
                    imagesByGroup[gid].push(ir.images);
                }
            } catch (_) {}
        }
        const base = `${req.protocol}://${req.headers.host}/`;
        const toAbs = (p) => (p ? (p.startsWith('http') ? p : base + p) : null);
        const data = rows.map(r => {
            const list = (r.id_images_post && imagesByGroup[r.id_images_post]) ? imagesByGroup[r.id_images_post].map(toAbs) : [];
            return {
                ...r,
                images: r.images ? toAbs(r.images) : (list[0] || null),
                images_list: list,
                user_image: r.user_image ? toAbs(r.user_image) : null,
            };
        });
        return res.status(200).json({ msg: "ดึงความคิดเห็นของผู้ใช้สำเร็จ", data });
    } catch (err) {
        console.log("error get_my_comments", err);
        return res.status(500).json({ msg: "ไม่สามารถดึงความคิดเห็นได้", error: err.message });
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
                SELECT id_post, COUNT(*) AS comments, ROUND(LEAST(AVG(star), 5), 2) AS avg_star
                FROM comment_post
                WHERE status IS NULL OR status <> '0'
                GROUP BY id_post
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
                SELECT id_post, COUNT(*) AS comments, ROUND(LEAST(AVG(star), 5), 2) AS avg_star
                FROM comment_post
                WHERE status IS NULL OR status <> '0'
                GROUP BY id_post
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

    // ตัดค่าว่างจากตัวแปรที่รับ
    const trimmedNameLocation = name_location ? name_location.replace(/\s+/g, ' ').trim() : "";
    const trimmedDetailLocation = detail_location ? detail_location.trim() : "";
    const trimmedPhone = phone ? phone.trim() : "";
    const trimmedDetailAtt = detail_att ? detail_att.trim() : "";

    // ตรวจสอบ name_location ซ้ำ
    const [dupRows] = await db
      .promise()
      .query("SELECT id_post FROM user_post WHERE name_location = ?", [trimmedNameLocation]);
    if (dupRows.length > 0) {
      if (image && image.path) {
        deleteImage(image.path);
      }
      return res.status(400).json({
        msg: "ชื่อสถานที่นี้ถูกใช้ไปแล้ว",
        error: "ชื่อสถานที่ซ้ำ",
      });
    }

    const [rows] = await db
      .promise()
      .query(
        "INSERT INTO user_post (name_location, detail_location, phone, detail_att, images, latitude, longitude, date, type, id_type) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
          trimmedNameLocation,
          trimmedDetailLocation,
          trimmedPhone,
          trimmedDetailAtt,
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
        // Trim name_location for duplicate check
        const trimmedNameLocation = name_location ? name_location.replace(/\s+/g, ' ').trim() : "";

        // ตรวจสอบ name_location ซ้ำ (ยกเว้นตัวเอง)
        const [dupRows] = await db.promise().query(
            "SELECT id_post FROM user_post WHERE name_location = ? AND id_post <> ?",
            [trimmedNameLocation, id]
        );
        if (dupRows.length > 0) {
            if (req.file && req.file.path) {
                deleteImage(req.file.path);
            }
            return res.status(400).json({
                msg: "ชื่อสถานที่นี้ถูกใช้ไปแล้ว",
                error: "ชื่อสถานที่ซ้ำ"
            });
        }

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

        // Cascade-like cleanup for related records (comments, images, likes)
        try {
            await ensureCommentImagesSupport();
            // 1) Clean up comment images (single + groups) for this post
            let commentRows = [];
            try {
                const [cr] = await db
                    .promise()
                    .query("SELECT id_comment, images, id_images_post FROM comment_post WHERE id_post = ?", [id]);
                commentRows = cr || [];
            } catch (_) {
                const [cr] = await db
                    .promise()
                    .query("SELECT id_comment, images FROM comment_post WHERE id_post = ?", [id]);
                commentRows = cr || [];
            }
            for (const r of commentRows) {
                if (r?.images && fs.existsSync(r.images)) {
                    try { deleteImage(r.images); } catch (_) {}
                }
                if (r?.id_images_post) {
                    try { await deleteImagesGroup(r.id_images_post); } catch (_) {}
                }
            }
            // 2) Delete comments (replies will cascade by FK comment_reply -> comment_post)
            await db.promise().query("DELETE FROM comment_post WHERE id_post = ?", [id]);
            // 3) Delete likes
            await db.promise().query("DELETE FROM like_post WHERE id_post = ?", [id]);
            // Note: user_prodact has FK ON DELETE SET NULL; leave as per schema
        } catch (_) { /* best effort cleanup */ }

        // Delete post image file
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
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .map(p => ({
            ...p,
            images: p.images ? `${req.protocol}://${req.headers.host}/${p.images}` : null,
        }));
        return res.status(200).json({ data: nearby });
    } catch (err) {
        console.log("error nearby", err);
        return res.status(500).json({ msg: "ไม่สามารถดึงสถานที่ใกล้เคียงได้", error: err.message });
    }
}

exports.comment_post = async (req, res) => {
    const {id_post} = req.params;
    const {userId, star, comment} = req.body;
    // Support multiple files via req.files (array)
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    
    
    try{
        await ensureCommentImagesSupport();

        let imagePath = null;
        let groupId = null;

        // Prepare image storage (first image path for legacy column, all images to images table)
        const filePaths = (files || []).map((f) => f?.path).filter(Boolean);
        const colExists = await hasCommentImagesColumn();
        if (filePaths.length > 0) {
            imagePath = filePaths[0];
            if (colExists) {
                groupId = await getNextImageGroupId();
                await insertImagesForGroup(groupId, filePaths);
            }
        }

        let rows;
        if (colExists) {
            [rows] = await db.promise().query(
                `INSERT INTO comment_post (id_post,id_user,date_comment,images,star,comment,id_images_post) VALUES (?,?,?,?,?,?,?)`,
                [id_post,userId,getFormattedNow(),imagePath,star,comment,groupId]
            );
        } else {
            [rows] = await db.promise().query(
                `INSERT INTO comment_post (id_post,id_user,date_comment,images,star,comment) VALUES (?,?,?,?,?,?)`,
                [id_post,userId,getFormattedNow(),imagePath,star,comment]
            );
        }
        if(rows.affectedRows === 0){
            // rollback any uploaded files
            if (groupId) {
                try { await deleteImagesGroup(groupId); } catch(_) {}
            } else if (imagePath) {
                try { deleteImage(imagePath); } catch(_) {}
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

// แก้ไขคอมเมนต์ของตนเอง (รองรับหลายรูป)
exports.edit_comment = async (req, res) => {
    try {
        const { id } = req.params; // id_comment
        const { id_user, comment, star, remove_image, remove_images } = req.body;

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

        await ensureCommentImagesSupport();

        // รองรับหลายไฟล์จาก req.files (multer array)
        const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
        const colExists = await hasCommentImagesColumn();
        let imagePath = cm.images || null;
        let groupId = colExists ? (cm.id_images_post || null) : null;

        const wantRemoveAll = remove_images === '1' || remove_images === 'true' || remove_image === '1' || remove_image === 'true';
        if (wantRemoveAll) {
            if (colExists && groupId) await deleteImagesGroup(groupId);
            groupId = null;
            if (imagePath && fs.existsSync(imagePath)) {
                deleteImage(imagePath);
            }
            imagePath = null;
        }

        if (files && files.length > 0) {
            const filePaths = files.map(f => f?.path).filter(Boolean);
            if (colExists) {
                // แทนที่ชุดรูปเดิมทั้งหมด
                if (groupId) {
                    await deleteImagesGroup(groupId);
                } else {
                    groupId = await getNextImageGroupId();
                }
                if (filePaths.length > 0) {
                    imagePath = filePaths[0];
                    await insertImagesForGroup(groupId, filePaths);
                } else {
                    imagePath = null;
                }
            } else {
                // ไม่มีคอลัมน์ชุดรูป ใช้เพียงรูปเดียว
                imagePath = filePaths[0] || null;
            }
        }

        const newComment = typeof comment === 'string' ? comment : cm.comment;
        const newStar = (star !== undefined && star !== null && star !== '') ? star : cm.star;

        let result;
        if (colExists) {
            [result] = await db.promise().query(
                "UPDATE comment_post SET comment = ?, star = ?, images = ?, id_images_post = ? WHERE id_comment = ?",
                [newComment, newStar, imagePath, groupId, id]
            );
        } else {
            [result] = await db.promise().query(
                "UPDATE comment_post SET comment = ?, star = ?, images = ? WHERE id_comment = ?",
                [newComment, newStar, imagePath, id]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({ msg: "ไม่สามารถแก้ไขความคิดเห็นได้", error: "update failed" });
        }

        const [updatedRows] = await db.promise().query("SELECT * FROM comment_post WHERE id_comment = ?", [id]);
        const updated = updatedRows[0];

        const base = `${req.protocol}://${req.headers.host}/`;
        const toAbs = (p) => (p ? (p.startsWith('http') ? p : base + p) : null);
        let images_list = [];
        if (colExists && updated.id_images_post) {
            try {
                const [imgRows] = await db
                  .promise()
                  .query('SELECT images FROM images WHERE id_mages_post = ?', [updated.id_images_post]);
                images_list = imgRows.map(r => toAbs(r.images));
            } catch(_) {}
        }
        return res.status(200).json({
            msg: "แก้ไขความคิดเห็นสำเร็จ",
            data: {
                ...updated,
                images: updated.images ? toAbs(updated.images) : (images_list[0] || null),
                images_list,
            }
        });
    } catch (err) {
        console.log("error edit comment", err);
        // ลบไฟล์ใหม่ที่อัปโหลดแล้วหากเกิดข้อผิดพลาด
        if (Array.isArray(req.files)) {
            for (const f of req.files) {
                if (f?.path && fs.existsSync(f.path)) {
                    try { fs.unlinkSync(f.path); } catch(_) {}
                }
            }
        } else if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(500).json({ msg: "ไม่สามารถแก้ไขความคิดเห็นได้", error: err.message });
    }
}

// Add: get list of post types
exports.get_post_types = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`SELECT post_type.id_type as id_type,name_type, COUNT(id_post) as count_location  FROM post_type LEFT JOIN 
                user_post on post_type.id_type=user_post.id_type GROUP BY post_type.id_type,name_type`);
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
    // อ่านพารามิเตอร์ไว้ก่อน เพื่อให้ใช้งานได้ใน catch ด้วย
    const { id } = req.params;
    try {
        // ตรวจสอบว่ามี user_post ที่ใช้ id_type นี้หรือไม่
        const [usedRows] = await db.promise().query(
            "SELECT COUNT(*) as count FROM user_post WHERE id_type = ?",
            [id]
        );
        if (usedRows[0].count > 0) {
            return res.status(409).json({ msg: "ไม่สามารถลบประเภทได้ เนื่องจากมีโพสต์ใช้งานอยู่" });
        }
        const [result] = await db.promise().query(
            "DELETE FROM post_type WHERE id_type = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "ไม่พบประเภทที่ต้องการลบ"+id });
        }
        return res.status(200).json({ msg: "ลบประเภทสำเร็จ" });
    } catch (err) {
        console.log("error delete post type", err);
        // จัดการกรณีติด Foreign Key constraint จาก DB โดยตรง
        if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451)) {
            return res.status(409).json({ msg: "ไม่สามารถลบประเภทได้ เนื่องจากมีโพสต์ใช้งานอยู่" });
        }
        return res.status(500).json({ msg: "ไม่สามารถลบประเภทได้" + (id ? ` (${id})` : ""), error: err.message });
    }
};

// Ensure schema for multi-image comments (MySQL 5.7 safe)
let _hasCommentImagesColCache = null;
const hasCommentImagesColumn = async () => {
    if (_hasCommentImagesColCache !== null) return _hasCommentImagesColCache;
    try {
        const [cols] = await db
            .promise()
            .query("SHOW COLUMNS FROM comment_post LIKE 'id_images_post'");
        _hasCommentImagesColCache = Array.isArray(cols) && cols.length > 0;
    } catch (_) {
        _hasCommentImagesColCache = false;
    }
    return _hasCommentImagesColCache;
};
const ensureCommentImagesSupport = async () => {
    try {
        const exists = await hasCommentImagesColumn();
        if (!exists) {
            await db
                .promise()
                .query("ALTER TABLE comment_post ADD COLUMN id_images_post INT NULL");
            _hasCommentImagesColCache = true;
        }
    } catch (_) {
        // ignore add column failure (e.g., permissions); fallback to single-image mode
        _hasCommentImagesColCache = await hasCommentImagesColumn();
    }
    try {
        // Ensure images table exists (generic bucket used elsewhere too)
        await db
            .promise()
            .query(
                `CREATE TABLE IF NOT EXISTS images (
                    id_mages_post INT NULL,
                    images VARCHAR(255) NULL,
                    id_images_event INT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8`
            );
    } catch (_) {}
};

const getNextImageGroupId = async () => {
    const [rows] = await db
        .promise()
        .query('SELECT COALESCE(MAX(id_mages_post),0) AS max_id FROM images');
    return Number(rows?.[0]?.max_id || 0) + 1;
};

const insertImagesForGroup = async (groupId, filePaths = []) => {
    if (!filePaths || filePaths.length === 0) return;
    const values = filePaths.map((p) => [groupId, p, null]);
    await db
        .promise()
        .query('INSERT INTO images (id_mages_post, images, id_images_event) VALUES ?',[values]);
};

const deleteImagesGroup = async (groupId) => {
    if (!groupId) return;
    const [rows] = await db
        .promise()
        .query('SELECT images FROM images WHERE id_mages_post = ?', [groupId]);
    for (const r of rows) {
        const p = r?.images;
        if (p && fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch(_) {}
        }
    }
    await db.promise().query('DELETE FROM images WHERE id_mages_post = ?', [groupId]);
};

exports.get_type_name = async (req, res) => {
    try{
        const [rows] = await db.promise().query(`SELECT name_type, COUNT(id_post) as count_location  FROM post_type LEFT JOIN 
                user_post on post_type.id_type=user_post.id_type GROUP BY name_type`);
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
