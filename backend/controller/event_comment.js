const db = require('../config/db');
const dayjs = require('dayjs');

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return `${req.protocol}://${req.headers.host}/${filePath}`;
};

// Ensure event comment tables
const ensureTables = async () => {
  try {
    await db.promise().query(`CREATE TABLE IF NOT EXISTS event_comment (
      id_comment INT NOT NULL AUTO_INCREMENT,
      id_event INT NOT NULL,
      id_user INT NOT NULL,
      date_comment DATETIME NULL,
      comment VARCHAR(255) NULL,
      images VARCHAR(255) NULL,
      star CHAR(5) NULL,
      status VARCHAR(1) NULL,
      PRIMARY KEY (id_comment)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await db.promise().query(`CREATE TABLE IF NOT EXISTS event_comment_reply (
      id_reply INT NOT NULL AUTO_INCREMENT,
      id_comment INT NOT NULL,
      id_user INT NOT NULL,
      reply TEXT NOT NULL,
      reply_date DATETIME NULL,
      user_image VARCHAR(255) NULL,
      parent_reply_id INT NULL,
      status VARCHAR(1) NULL,
      PRIMARY KEY (id_reply)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  } catch (e) {}
};

// Comments
exports.add_comment = async (req, res) => {
  try {
    await ensureTables();
    const { id_event } = req.params;
    const { userId, star, comment } = req.body;
    const image = req.file;
    if (!id_event || !userId) {
      return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน', error: 'ต้องระบุ id_event และ userId' });
    }
    const [r] = await db
      .promise()
      .query(
        `INSERT INTO event_comment (id_event,id_user,date_comment,images,star,comment) VALUES (?,?,?,?,?,?)`,
        [id_event, userId, now(), image?.path || null, star || null, comment || null]
      );
    if (r.affectedRows === 0) {
      return res.status(400).json({ msg: 'ไม่สามารถคอมเมนต์ได้' });
    }
    return res.status(200).json({ msg: 'คอมเมนต์สำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถคอมเมนต์ได้', error: err.message });
  }
};

exports.get_comments = async (req, res) => {
  try {
    await ensureTables();
    const { id_event } = req.params;
    const [rows] = await db
      .promise()
      .query(
        `SELECT ec.*, u.first_name, u.image_profile
         FROM event_comment ec
         JOIN user u ON u.id_user = ec.id_user
         WHERE ec.id_event = ? AND (ec.status IS NULL OR ec.status <> '0')
         ORDER BY ec.date_comment DESC`,
        [id_event]
      );
    const data = rows.map((row) => ({
      ...row,
      images: buildFileUrl(req, row.images),
      user_image: buildFileUrl(req, row.image_profile),
    }));
    return res.status(200).json({ msg: 'ดึงความเห็นสำเร็จ', data });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงความเห็นได้', error: err.message });
  }
};

exports.edit_comment = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { id_user, comment, star, remove_image } = req.body;
    if (!id || !id_user) return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน' });
    const [rows] = await db.promise().query('SELECT * FROM event_comment WHERE id_comment = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ msg: 'ไม่พบความคิดเห็น' });
    const cm = rows[0];
    if (String(cm.id_user) !== String(id_user)) return res.status(403).json({ msg: 'ไม่มีสิทธิ์แก้ไข' });
    let imagePath = cm.images || null;
    if (req.file && req.file.path) imagePath = req.file.path;
    else if (remove_image === '1' || remove_image === 'true') imagePath = null;
    await db
      .promise()
      .query('UPDATE event_comment SET comment = ?, star = ?, images = ? WHERE id_comment = ?', [
        typeof comment === 'string' ? comment : cm.comment,
        star ?? cm.star,
        imagePath,
        id,
      ]);
    return res.status(200).json({ msg: 'แก้ไขความคิดเห็นสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถแก้ไขได้', error: err.message });
  }
};

exports.delete_comment = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const [r] = await db.promise().query('DELETE FROM event_comment WHERE id_comment = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ msg: 'ไม่พบความคิดเห็น' });
    return res.status(200).json({ msg: 'ลบความคิดเห็นสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถลบได้', error: err.message });
  }
};

// Replies
exports.add_reply = async (req, res) => {
  try {
    await ensureTables();
    const { id_comment } = req.params;
    const { id_user, reply, parent_reply_id = null } = req.body;
    const file = req.file;
    if (!id_user || !reply || !id_comment) return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน' });
    const [pr] = await db.promise().query('SELECT id_comment FROM event_comment WHERE id_comment = ?', [id_comment]);
    if (pr.length === 0) return res.status(404).json({ msg: 'ไม่พบความคิดเห็น' });
    let parentReplyIdToUse = null;
    if (parent_reply_id) {
      const [pr2] = await db
        .promise()
        .query('SELECT id_reply, id_comment FROM event_comment_reply WHERE id_reply = ?', [parent_reply_id]);
      if (pr2.length === 0 || String(pr2[0].id_comment) !== String(id_comment)) {
        return res.status(400).json({ msg: 'parent invalid' });
      }
      parentReplyIdToUse = parent_reply_id;
    }
    const [ins] = await db
      .promise()
      .query(
        'INSERT INTO event_comment_reply (id_comment,id_user,reply,reply_date,user_image,parent_reply_id) VALUES (?,?,?,?,?,?)',
        [id_comment, id_user, reply, now(), file?.path || null, parentReplyIdToUse]
      );
    if (ins.affectedRows === 0) return res.status(400).json({ msg: 'ไม่สามารถตอบกลับได้' });
    return res.status(201).json({ msg: 'ตอบกลับสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถตอบกลับได้', error: err.message });
  }
};

exports.get_replies = async (req, res) => {
  try {
    await ensureTables();
    const { id_comment } = req.params;
    const [rows] = await db
      .promise()
      .query(
        `SELECT r.*, u.first_name AS reply_user_name, u.image_profile AS reply_user_image
         FROM event_comment_reply r
         LEFT JOIN user u ON u.id_user = r.id_user
         WHERE r.id_comment = ? AND (r.status IS NULL OR r.status <> '0')
         ORDER BY r.reply_date ASC`,
        [id_comment]
      );
    const data = rows.map((row) => ({
      ...row,
      user_image: buildFileUrl(req, row.user_image),
      reply_user_image: buildFileUrl(req, row.reply_user_image),
    }));
    return res.status(200).json({ msg: 'ดึงการตอบกลับสำเร็จ', data });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงการตอบกลับได้', error: err.message });
  }
};

exports.edit_reply = async (req, res) => {
  try {
    await ensureTables();
    const { id_comment, id_reply } = req.params;
    const { id_user, reply, remove_image } = req.body;
    if (!id_user) return res.status(400).json({ msg: 'ต้องระบุ id_user' });
    const [rows] = await db.promise().query('SELECT * FROM event_comment_reply WHERE id_reply = ?', [id_reply]);
    if (rows.length === 0) return res.status(404).json({ msg: 'ไม่พบตอบกลับ' });
    const rep = rows[0];
    if (String(rep.id_comment) !== String(id_comment)) return res.status(400).json({ msg: 'id_comment mismatch' });
    if (String(rep.id_user) !== String(id_user)) return res.status(403).json({ msg: 'ไม่มีสิทธิ์แก้ไข' });
    let imagePath = rep.user_image || null;
    if (req.file && req.file.path) imagePath = req.file.path;
    else if (remove_image === '1' || remove_image === 'true') imagePath = null;
    await db
      .promise()
      .query('UPDATE event_comment_reply SET reply = ?, reply_date = ?, user_image = ? WHERE id_reply = ?', [
        typeof reply === 'string' ? reply : rep.reply,
        now(),
        imagePath,
        id_reply,
      ]);
    return res.status(200).json({ msg: 'แก้ไขตอบกลับสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถแก้ไขตอบกลับได้', error: err.message });
  }
};

exports.delete_reply = async (req, res) => {
  try {
    await ensureTables();
    const { id_comment, id_reply } = req.params;
    const id_user = req.body?.id_user || req.query?.id_user;
    if (!id_user) return res.status(400).json({ msg: 'ต้องระบุ id_user' });
    const [rows] = await db.promise().query('SELECT * FROM event_comment_reply WHERE id_reply = ?', [id_reply]);
    if (rows.length === 0) return res.status(404).json({ msg: 'ไม่พบตอบกลับ' });
    const rep = rows[0];
    if (String(rep.id_comment) !== String(id_comment)) return res.status(400).json({ msg: 'id_comment mismatch' });
    if (String(rep.id_user) !== String(id_user)) return res.status(403).json({ msg: 'ไม่มีสิทธิ์ลบ' });
    await db.promise().query('DELETE FROM event_comment_reply WHERE id_reply = ?', [id_reply]);
    return res.status(200).json({ msg: 'ลบตอบกลับสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถลบตอบกลับได้', error: err.message });
  }
};

// PATCH /api/event/comment_status/:id_comment { status: 0|1 }
exports.set_comment_status = async (req, res) => {
  try {
    await ensureTables();
    const { id_comment } = req.params;
    let { status } = req.body || {};
    if (!id_comment) return res.status(400).json({ msg: 'ต้องระบุ id_comment' });
    status = Number(status);
    if (status !== 0 && status !== 1) return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง ต้องเป็น 0 หรือ 1' });
    const [chk] = await db.promise().query('SELECT id_comment FROM event_comment WHERE id_comment = ?', [id_comment]);
    if (chk.length === 0) return res.status(404).json({ msg: 'ไม่พบความคิดเห็น' });
    await db.promise().query('UPDATE event_comment SET status = ? WHERE id_comment = ?', [String(status), id_comment]);
    return res.status(200).json({ msg: 'อัปเดตสถานะความคิดเห็นสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะความคิดเห็นได้', error: err.message });
  }
};

// PATCH /api/event/reply_status/:id_reply { status: 0|1 }
exports.set_reply_status = async (req, res) => {
  try {
    await ensureTables();
    const { id_reply } = req.params;
    let { status } = req.body || {};
    if (!id_reply) return res.status(400).json({ msg: 'ต้องระบุ id_reply' });
    status = Number(status);
    if (status !== 0 && status !== 1) return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง ต้องเป็น 0 หรือ 1' });
    const [chk] = await db.promise().query('SELECT id_reply FROM event_comment_reply WHERE id_reply = ?', [id_reply]);
    if (chk.length === 0) return res.status(404).json({ msg: 'ไม่พบตอบกลับ' });
    await db.promise().query('UPDATE event_comment_reply SET status = ? WHERE id_reply = ?', [String(status), id_reply]);
    return res.status(200).json({ msg: 'อัปเดตสถานะการตอบกลับสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะการตอบกลับได้', error: err.message });
  }
};
