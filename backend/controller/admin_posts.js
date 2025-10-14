const db = require("../config/db");
const fs = require('fs');

const deleteImage = (path) => {
    fs.unlink(path, (err) => {
        if (err) {
            console.error("Error deleting image:", err);
        } else {
            console.log("Image deleted successfully");
        }
    });
};

// Helpers for cascading deletion of related comment images
let _hasCommentImagesColCache = null;
const hasCommentImagesColumn = async () => {
    if (_hasCommentImagesColCache !== null) return _hasCommentImagesColCache;
    try {
        const [cols] = await db.promise().query("SHOW COLUMNS FROM comment_post LIKE 'id_images_post'");
        _hasCommentImagesColCache = Array.isArray(cols) && cols.length > 0;
    } catch (_) {
        _hasCommentImagesColCache = false;
    }
    return _hasCommentImagesColCache;
};

const deleteImagesGroup = async (groupId) => {
    if (!groupId) return;
    try {
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
    } catch (_) {}
};

// ดึงข้อมูลสถานที่ท่องเที่ยวทั้งหมด (สำหรับผู้ใช้ทั่วไป)
exports.get_posts = async (req, res) => {
    try {
        const { category, search } = req.query;
        let sql = `
            SELECT 
                p.*,
                COALESCE(l.likes, 0) AS likes,
                COALESCE(c.comments, 0) AS comments,
                COALESCE(c.avg_star, 0) AS star
            FROM admin_posts p
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS likes
                FROM like_post
                GROUP BY id_post
            ) l ON p.id_post = l.id_post
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS comments, ROUND(LEAST(AVG(star), 5), 2) AS avg_star
                FROM comment_post
                GROUP BY id_post
            ) c ON p.id_post = c.id_post
            WHERE p.status = 1
        `;
        
        const params = [];
        
        if (category) {
            sql += " AND p.category = ?";
            params.push(category);
        }
        
        if (search) {
            sql += " AND (p.name_location LIKE ? OR p.detail_location LIKE ? OR p.detail_att LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        sql += " ORDER BY (COALESCE(l.likes, 0) + COALESCE(c.comments, 0)) DESC, p.created_at DESC";
        
        const [rows] = await db.promise().query(sql, params);
        
        if (rows.length === 0) {
            return res.status(404).json({ msg: "ไม่พบสถานที่ท่องเที่ยว" });
        }

        const formatData = rows.map((row) => ({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}` : null,
        }));

        return res.status(200).json({ msg: "ดึงข้อมูลสถานที่ท่องเที่ยวสำเร็จ", data: formatData });

    } catch (err) {
        console.log("error get posts", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลสถานที่ท่องเที่ยวได้",
            error: err.message
        });
    }
};

// ดึงข้อมูลสถานที่ท่องเที่ยวตาม ID
exports.get_post_by_id = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.promise().query(`
            SELECT 
                p.*,
                COALESCE(l.likes, 0) AS likes,
                COALESCE(c.comments, 0) AS comments,
                COALESCE(c.avg_star, 0) AS star
            FROM admin_posts p
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS likes
                FROM like_post
                GROUP BY id_post
            ) l ON p.id_post = l.id_post
            LEFT JOIN (
                SELECT id_post, COUNT(*) AS comments, ROUND(LEAST(AVG(star), 5), 2) AS avg_star
                FROM comment_post
                GROUP BY id_post
            ) c ON p.id_post = c.id_post
            WHERE p.id_post = ? AND p.status = 1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: "ไม่พบสถานที่ท่องเที่ยว" });
        }

        const formatData = rows.map((row) => ({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}` : null,
        }));

        return res.status(200).json({ msg: "ดึงข้อมูลสถานที่ท่องเที่ยวสำเร็จ", data: formatData[0] });

    } catch (err) {
        console.log("error get post by id", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลสถานที่ท่องเที่ยวได้",
            error: err.message
        });
    }
};

// แอดมินเพิ่มสถานที่ท่องเที่ยว
exports.add_post = async (req, res) => {
    try {
        const {
            name_location,
            detail_location,
            phone,
            detail_att,
            latitude,
            longitude,
            category,
            price_range,
            opening_hours,
            facilities
        } = req.body;

        const image = req.file;

        const [rows] = await db.promise().query(`
            INSERT INTO admin_posts 
            (name_location, detail_location, phone, detail_att, latitude, longitude, category, price_range, opening_hours, facilities, images) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name_location,
            detail_location,
            phone,
            detail_att,
            latitude,
            longitude,
            category,
            price_range,
            opening_hours,
            facilities,
            image ? image.path : null
        ]);

        if (rows.affectedRows === 0) {
            if (image) deleteImage(image.path);
            return res.status(400).json({
                msg: "ไม่สามารถเพิ่มสถานที่ท่องเที่ยวได้",
                error: "ไม่สามารถเพิ่มสถานที่ท่องเที่ยวได้"
            });
        }

        return res.status(201).json({ msg: "เพิ่มสถานที่ท่องเที่ยวสำเร็จ" });

    } catch (err) {
        if (req.file) deleteImage(req.file.path);
        console.log("error add post", err);
        return res.status(500).json({
            msg: "ไม่สามารถเพิ่มสถานที่ท่องเที่ยวได้",
            error: err.message
        });
    }
};

// แอดมินแก้ไขสถานที่ท่องเที่ยว
exports.edit_post = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name_location,
            detail_location,
            phone,
            detail_att,
            latitude,
            longitude,
            category,
            price_range,
            opening_hours,
            facilities
        } = req.body;

        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path;
            // ลบรูปเดิม
            const [oldRows] = await db.promise().query("SELECT images FROM admin_posts WHERE id_post = ?", [id]);
            if (oldRows.length > 0 && oldRows[0].images && fs.existsSync(oldRows[0].images)) {
                deleteImage(oldRows[0].images);
            }
        }

        if (!imagePath) {
            const [oldRows] = await db.promise().query("SELECT images FROM admin_posts WHERE id_post = ?", [id]);
            imagePath = oldRows.length > 0 ? oldRows[0].images : null;
        }

        const [rows] = await db.promise().query(`
            UPDATE admin_posts 
            SET name_location = ?, detail_location = ?, phone = ?, detail_att = ?, 
                latitude = ?, longitude = ?, category = ?, price_range = ?, 
                opening_hours = ?, facilities = ?, images = ?
            WHERE id_post = ?
        `, [
            name_location,
            detail_location,
            phone,
            detail_att,
            latitude,
            longitude,
            category,
            price_range,
            opening_hours,
            facilities,
            imagePath,
            id
        ]);

        if (rows.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถแก้ไขสถานที่ท่องเที่ยวได้",
                error: "ไม่สามารถแก้ไขสถานที่ท่องเที่ยวได้"
            });
        }

        return res.status(200).json({ msg: "แก้ไขสถานที่ท่องเที่ยวสำเร็จ" });

    } catch (err) {
        console.log("error edit post", err);
        return res.status(500).json({
            msg: "ไม่สามารถแก้ไขสถานที่ท่องเที่ยวได้",
            error: err.message
        });
    }
};

// แอดมินลบสถานที่ท่องเที่ยว
exports.delete_post = async (req, res) => {
    try {
        const { id } = req.params;

        // ดึงข้อมูลรูปภาพก่อนลบ
        const [rows] = await db.promise().query("SELECT images FROM admin_posts WHERE id_post = ?", [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                msg: "ไม่พบสถานที่ท่องเที่ยว",
                error: "ไม่พบสถานที่ท่องเที่ยว"
            });
        }

        // ลบรูปภาพ
        if (rows[0].images && fs.existsSync(rows[0].images)) {
            deleteImage(rows[0].images);
        }

        // ลบคอมเมนต์/ไลค์ที่เกี่ยวข้อง (เทียบเท่า ON DELETE CASCADE)
        try {
            const colExists = await hasCommentImagesColumn();
            let commentRows = [];
            if (colExists) {
                const [cr] = await db
                    .promise()
                    .query('SELECT id_comment, images, id_images_post FROM comment_post WHERE id_post = ?', [id]);
                commentRows = cr || [];
            } else {
                const [cr] = await db
                    .promise()
                    .query('SELECT id_comment, images FROM comment_post WHERE id_post = ?', [id]);
                commentRows = cr || [];
            }
            for (const r of commentRows) {
                if (r?.images && fs.existsSync(r.images)) {
                    try { fs.unlinkSync(r.images); } catch(_) {}
                }
                if (r?.id_images_post) {
                    await deleteImagesGroup(r.id_images_post);
                }
            }
            // ลบคอมเมนต์ (reply จะโดนลบตาม FK ที่ DB ถ้ามี)
            await db.promise().query('DELETE FROM comment_post WHERE id_post = ?', [id]);
            // ลบไลค์ของโพสต์นี้
            await db.promise().query('DELETE FROM like_post WHERE id_post = ?', [id]);
        } catch (_) { /* best effort */ }

        // ลบข้อมูล
        const [result] = await db.promise().query("DELETE FROM admin_posts WHERE id_post = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถลบสถานที่ท่องเที่ยวได้",
                error: "ไม่สามารถลบสถานที่ท่องเที่ยวได้"
            });
        }

        return res.status(200).json({ msg: "ลบสถานที่ท่องเที่ยวสำเร็จ" });

    } catch (err) {
        console.log("error delete post", err);
        return res.status(500).json({
            msg: "ไม่สามารถลบสถานที่ท่องเที่ยวได้",
            error: err.message
        });
    }
};


exports.get_categories = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT DISTINCT category 
            FROM admin_posts 
            WHERE status = 1 AND category IS NOT NULL 
            ORDER BY category
        `);

        return res.status(200).json({ 
            msg: "ดึงข้อมูลหมวดหมู่สำเร็จ", 
            data: rows.map(row => row.category) 
        });

    } catch (err) {
        console.log("error get categories", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลหมวดหมู่ได้",
            error: err.message
        });
    }
};
