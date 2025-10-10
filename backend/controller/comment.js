const dayjs = require("dayjs");
require("dayjs/locale/th");
dayjs.locale("th");

const db = require("../config/db");

const getFormattedNow = () => dayjs().format("YYYY-MM-DD HH:mm:ss");


const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  return `${req.protocol}://${req.headers.host}/${filePath}`;
};
const fs = require('fs');


// Ensure comment_reply table exists (used by other controllers)
exports.ensureReplyTable = async () => {
  try {
    await db
      .promise()
      .query(
        `CREATE TABLE IF NOT EXISTS comment_reply (
          id_reply INT NOT NULL AUTO_INCREMENT,
          id_comment INT NOT NULL,
          id_user INT NOT NULL,
          reply TEXT NOT NULL,
          reply_date DATETIME DEFAULT NULL,
          user_image VARCHAR(255) DEFAULT NULL,
          parent_reply_id INT NULL,
          PRIMARY KEY (id_reply)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      );
    // Try add column for existing deployments (ignore if not supported or already exists)
    await db
      .promise()
      .query(
        "ALTER TABLE comment_reply ADD COLUMN IF NOT EXISTS parent_reply_id INT NULL"
      )
      .catch(() => {});
  } catch (err) {
    // Log but do not throw to avoid breaking request chains
    console.log("ensureReplyTable error:", err);
  }
};



// POST /api/comment/:id_comment/replies
exports.add_reply = async (req, res) => {
  try {
    // ensure table exists
    if (exports.ensureReplyTable) {
      await exports.ensureReplyTable();
    }
    const { id_comment } = req.params;
    const { id_user, reply, parent_reply_id = null } = req.body;
    const file = req.file;

    if (!id_user || !reply || !id_comment) {
      return res.status(400).json({
        msg: "ข้อมูลไม่ครบถ้วน",
        error: "ต้องระบุ id_user, id_comment และ reply"
      });
    }


    const [parentRows] = await db
      .promise()
      .query("SELECT id_user FROM comment_post WHERE id_comment = ?", [id_comment]);

    if (parentRows.length === 0) {
      return res.status(404).json({
        msg: "ไม่พบความคิดเห็นที่จะตอบกลับ",
        error: "ไม่พบความคิดเห็นต้นทาง"
      });
    }

    // If replying to a reply, validate parent
    let parentReplyIdToUse = null;
    if (parent_reply_id) {
      const [pr] = await db
        .promise()
        .query(
          "SELECT id_reply, id_comment, parent_reply_id FROM comment_reply WHERE id_reply = ?",
          [parent_reply_id]
        );
      if (pr.length === 0) {
        return res.status(400).json({
          msg: "ไม่พบการตอบกลับต้นทาง",
          error: "invalid parent_reply_id"
        });
      }
      if (String(pr[0].id_comment) !== String(id_comment)) {
        return res.status(400).json({
          msg: "การตอบกลับต้องอยู่ในคอมเมนต์เดียวกัน",
          error: "parent and child must share id_comment"
        });
      }
      parentReplyIdToUse = parent_reply_id;
    }

    const imagePath = file && file.path ? file.path : null;

    const [insertResult] = await db
      .promise()
      .query(
        "INSERT INTO comment_reply (id_comment, id_user, reply, reply_date, user_image, parent_reply_id) VALUES (?,?,?,?,?,?)",
        [id_comment, id_user, reply, getFormattedNow(), imagePath, parentReplyIdToUse]
      );

    if (insertResult.affectedRows === 0) {
      return res.status(400).json({
        msg: "ไม่สามารถตอบกลับคอมเมนต์ได้",
        error: "ไม่สามารถบันทึกข้อมูลการตอบกลับได้"
      });
    }

    return res.status(201).json({
      msg: "ตอบกลับความคิดเห็นสำเร็จ",
      data: {
        id_reply: insertResult.insertId,
        id_comment,
        id_user,
        reply,
        reply_date: getFormattedNow(),
        user_image: buildFileUrl(req, imagePath),
        parent_reply_id: parentReplyIdToUse
      }
    });
  } catch (err) {
    console.log("error add reply", err);
    return res.status(500).json({
      msg: "ไม่สามารถตอบกลับคอมเมนต์ได้",
      error: err.message
    });
  }
};

// GET /api/comment/:id_comment/replies
exports.get_replies = async (req, res) => {
  try {
    const { id_comment } = req.params;
    if (exports.ensureReplyTable) {
      await exports.ensureReplyTable();
    }

    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            r.id_reply,
            r.id_comment,
            r.id_user,
            r.reply,
            r.reply_date,
            r.user_image,
            r.parent_reply_id,
            u.first_name AS reply_user_name,
            u.image_profile AS reply_user_image,
            cp.id_user AS target_user_id,
            target.first_name AS target_user_name,
            pr.id_reply AS parent_id,
            pu.first_name AS parent_reply_user_name
         FROM comment_reply r
         LEFT JOIN user u ON u.id_user = r.id_user
         LEFT JOIN comment_post cp ON cp.id_comment = r.id_comment
         LEFT JOIN user target ON target.id_user = cp.id_user
         LEFT JOIN comment_reply pr ON pr.id_reply = r.parent_reply_id
         LEFT JOIN user pu ON pu.id_user = pr.id_user
         WHERE r.id_comment = ?
           AND (r.status IS NULL OR r.status <> '0')
         ORDER BY r.reply_date ASC`,
        [id_comment]
      );

    const formatted = rows.map((row) => ({
      ...row,
      reply_date: row.reply_date ? dayjs(row.reply_date).toISOString() : null,
      user_image: buildFileUrl(req, row.user_image),
      reply_user_image: buildFileUrl(req, row.reply_user_image)
    }));

    return res.status(200).json({
      msg: "ดึงข้อมูลการตอบกลับสำเร็จ",
      data: formatted
    });
  } catch (err) {
    console.log("error get replies", err);
    return res.status(500).json({
      msg: "ไม่สามารถดึงข้อมูลตอบกลับได้",
      error: err.message
    });
  }
};

// PATCH /api/comment/:id_comment/replies/:id_reply
exports.edit_reply = async (req, res) => {
  try {
    const { id_comment, id_reply } = req.params;
    const { id_user, reply, remove_image } = req.body;

    if (!id_user) {
      return res.status(400).json({ msg: "ข้อมูลไม่ครบถ้วน", error: "ต้องระบุ id_user" });
    }

    if (exports.ensureReplyTable) {
      await exports.ensureReplyTable();
    }

    const [rows] = await db
      .promise()
      .query("SELECT * FROM comment_reply WHERE id_reply = ?", [id_reply]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: "ไม่พบข้อมูลตอบกลับ" });
    }

    const rep = rows[0];
    if (String(rep.id_comment) !== String(id_comment)) {
      return res.status(400).json({ msg: "รหัสคอมเมนต์ไม่ตรงกัน", error: "id_comment mismatch" });
    }
    if (String(rep.id_user) !== String(id_user)) {
      return res.status(403).json({ msg: "ไม่มีสิทธิ์แก้ไข", error: "forbidden" });
    }

    let imagePath = rep.user_image || null;
    if (req.file && req.file.path) {
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlink(imagePath, () => {});
      }
      imagePath = req.file.path;
    } else if (remove_image === '1' || remove_image === 'true') {
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlink(imagePath, () => {});
      }
      imagePath = null;
    }

    const newReply = typeof reply === 'string' ? reply : rep.reply;

    await db
      .promise()
      .query(
        "UPDATE comment_reply SET reply = ?, reply_date = ?, user_image = ? WHERE id_reply = ?",
        [newReply, getFormattedNow(), imagePath, id_reply]
      );

    // Return updated row with formatted URLs
    const [updatedRows] = await db
      .promise()
      .query(
        `SELECT 
            r.*, 
            u.first_name AS reply_user_name,
            u.image_profile AS reply_user_image,
            cp.id_user AS target_user_id,
            target.first_name AS target_user_name
         FROM comment_reply r
         LEFT JOIN user u ON u.id_user = r.id_user
         LEFT JOIN comment_post cp ON cp.id_comment = r.id_comment
         LEFT JOIN user target ON target.id_user = cp.id_user
         WHERE r.id_reply = ?`,
        [id_reply]
      );
    const u = updatedRows[0];
    return res.status(200).json({
      msg: "แก้ไขการตอบกลับสำเร็จ",
      data: {
        ...u,
        reply_date: u.reply_date ? dayjs(u.reply_date).toISOString() : null,
        user_image: buildFileUrl(req, u.user_image),
        reply_user_image: buildFileUrl(req, u.reply_user_image),
      },
    });
  } catch (err) {
    console.log("error edit reply", err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ msg: "ไม่สามารถแก้ไขตอบกลับได้", error: err.message });
  }
};

// DELETE /api/comment/:id_comment/replies/:id_reply
exports.delete_reply = async (req, res) => {
  try {
    const { id_comment, id_reply } = req.params;
    const id_user = req.body?.id_user || req.query?.id_user;

    if (!id_user) {
      return res.status(400).json({ msg: "ข้อมูลไม่ครบถ้วน", error: "ต้องระบุ id_user" });
    }

    if (exports.ensureReplyTable) {
      await exports.ensureReplyTable();
    }

    const [rows] = await db
      .promise()
      .query("SELECT * FROM comment_reply WHERE id_reply = ?", [id_reply]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: "ไม่พบข้อมูลตอบกลับ" });
    }

    const rep = rows[0];
    if (String(rep.id_comment) !== String(id_comment)) {
      return res.status(400).json({ msg: "รหัสคอมเมนต์ไม่ตรงกัน", error: "id_comment mismatch" });
    }
    if (String(rep.id_user) !== String(id_user)) {
      return res.status(403).json({ msg: "ไม่มีสิทธิ์ลบ", error: "forbidden" });
    }

    // delete file if exists
    if (rep.user_image && fs.existsSync(rep.user_image)) {
      try { fs.unlink(rep.user_image, () => {}); } catch (_) {}
    }

    const [result] = await db
      .promise()
      .query("DELETE FROM comment_reply WHERE id_reply = ?", [id_reply]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: "ไม่สามารถลบการตอบกลับได้" });
    }

    return res.status(200).json({ msg: "ลบการตอบกลับสำเร็จ" });
  } catch (err) {
    console.log("error delete reply", err);
    return res.status(500).json({ msg: "ไม่สามารถลบการตอบกลับได้", error: err.message });
  }
};

// PATCH /api/post/reply_status/:id_reply { status: 0|1 }
exports.set_reply_status = async (req, res) => {
  try {
    const { id_reply } = req.params;
    let { status } = req.body || {};
    if (!id_reply) {
      return res.status(400).json({ msg: 'ต้องระบุ id_reply' });
    }
    status = Number(status);
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง ต้องเป็น 0 หรือ 1' });
    }
    const [chk] = await db.promise().query('SELECT id_reply FROM comment_reply WHERE id_reply = ?', [id_reply]);
    if (chk.length === 0) return res.status(404).json({ msg: 'ไม่พบการตอบกลับ' });
    await db.promise().query('UPDATE comment_reply SET status = ? WHERE id_reply = ?', [String(status), id_reply]);
    return res.status(200).json({ msg: 'อัปเดตสถานะการตอบกลับสำเร็จ' });
  } catch (err) {
    console.log('set_reply_status error', err);
    return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะการตอบกลับได้', error: err.message });
  }
};
