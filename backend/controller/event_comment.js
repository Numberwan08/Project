const db = require('../config/db');
const dayjs = require('dayjs');
const fs = require('fs');

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const { getIO } = require('../socket');

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

// Multi-image helpers for event comments
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

const ensureEventCommentImagesSupport = async () => {
  await ensureTables();
  try {
    const exists = await hasEventImagesColumn();
    if (!exists) {
      await db.promise().query('ALTER TABLE event_comment ADD COLUMN id_images_event INT NULL');
      _hasEventImagesColCache = true;
    }
  } catch (_) {
    _hasEventImagesColCache = await hasEventImagesColumn();
  }
  try {
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

const getNextEventImageGroupId = async () => {
  const [rows] = await db
    .promise()
    .query('SELECT COALESCE(MAX(id_images_event),0) AS max_id FROM images');
  return Number(rows?.[0]?.max_id || 0) + 1;
};

const insertEventImagesForGroup = async (groupId, filePaths = []) => {
  if (!filePaths || filePaths.length === 0) return;
  const values = filePaths.map((p) => [null, p, groupId]);
  await db
    .promise()
    .query('INSERT INTO images (id_mages_post, images, id_images_event) VALUES ?',[values]);
};

const deleteEventImagesGroup = async (groupId) => {
  if (!groupId) return;
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
};

// Comments
exports.add_comment = async (req, res) => {
  try {
    await ensureEventCommentImagesSupport();
    const { id_event } = req.params;
    const { userId, star, comment } = req.body;
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    if (!id_event || !userId) {
      return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน', error: 'ต้องระบุ id_event และ userId' });
    }
    const colExists = await hasEventImagesColumn();
    const filePaths = (files || []).map(f => f?.path).filter(Boolean);
    let firstPath = null;
    let groupId = null;
    if (filePaths.length > 0) {
      firstPath = filePaths[0];
      if (colExists) {
        groupId = await getNextEventImageGroupId();
        await insertEventImagesForGroup(groupId, filePaths);
      }
    }
    let r;
    if (colExists) {
      [r] = await db
        .promise()
        .query(
          `INSERT INTO event_comment (id_event,id_user,date_comment,images,star,comment,id_images_event) VALUES (?,?,?,?,?,?,?)`,
          [id_event, userId, now(), firstPath, star || null, comment || null, groupId]
        );
    } else {
      [r] = await db
        .promise()
        .query(
          `INSERT INTO event_comment (id_event,id_user,date_comment,images,star,comment) VALUES (?,?,?,?,?,?)`,
          [id_event, userId, now(), firstPath, star || null, comment || null]
        );
    }
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
    await ensureEventCommentImagesSupport();
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
    const colExists = await hasEventImagesColumn();
    let groups = [];
    if (colExists) {
      groups = rows.map(r => r.id_images_event).filter(v => v !== undefined && v !== null);
    }
    let imagesByGroup = {};
    if (groups.length > 0) {
      try {
        const [imgRows] = await db
          .promise()
          .query(
            `SELECT id_images_event, images FROM images WHERE id_images_event IN (${groups.map(()=> '?').join(',')})`,
            groups
          );
        for (const ir of imgRows) {
          const gid = ir.id_images_event;
          if (!imagesByGroup[gid]) imagesByGroup[gid] = [];
          imagesByGroup[gid].push(ir.images);
        }
      } catch(_) {}
    }
    const base = `${req.protocol}://${req.headers.host}/`;
    const toAbs = (p) => (p ? (p.startsWith('http') ? p : base + p) : null);
    const data = rows.map((row) => {
      const list = colExists && row.id_images_event && imagesByGroup[row.id_images_event] ? imagesByGroup[row.id_images_event].map(toAbs) : [];
      return {
        ...row,
        images: row.images ? toAbs(row.images) : (list[0] || null),
        images_list: list,
        user_image: toAbs(row.image_profile),
      };
    });
    return res.status(200).json({ msg: 'ดึงความเห็นสำเร็จ', data });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงความเห็นได้', error: err.message });
  }
};

exports.edit_comment = async (req, res) => {
  try {
    await ensureEventCommentImagesSupport();
    const { id } = req.params;
    const { id_user, comment, star, remove_image, remove_images } = req.body;
    if (!id || !id_user) return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน' });
    const [rows] = await db.promise().query('SELECT * FROM event_comment WHERE id_comment = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ msg: 'ไม่พบความคิดเห็น' });
    const cm = rows[0];
    if (String(cm.id_user) !== String(id_user)) return res.status(403).json({ msg: 'ไม่มีสิทธิ์แก้ไข' });
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    const colExists = await hasEventImagesColumn();
    let imagePath = cm.images || null;
    let groupId = colExists ? (cm.id_images_event || null) : null;
    const wantRemoveAll = remove_images === '1' || remove_images === 'true' || remove_image === '1' || remove_image === 'true';
    if (wantRemoveAll) {
      if (colExists && groupId) await deleteEventImagesGroup(groupId);
      groupId = null;
      imagePath = null;
    }
    if (files && files.length > 0) {
      const filePaths = files.map(f => f?.path).filter(Boolean);
      if (colExists) {
        if (groupId) await deleteEventImagesGroup(groupId);
        else groupId = await getNextEventImageGroupId();
        if (filePaths.length > 0) {
          imagePath = filePaths[0];
          await insertEventImagesForGroup(groupId, filePaths);
        } else {
          imagePath = null;
        }
      } else {
        imagePath = filePaths[0] || null;
      }
    }
    if (colExists) {
      await db
        .promise()
        .query('UPDATE event_comment SET comment = ?, star = ?, images = ?, id_images_event = ? WHERE id_comment = ?', [
          typeof comment === 'string' ? comment : cm.comment,
          star ?? cm.star,
          imagePath,
          groupId,
          id,
        ]);
    } else {
      await db
        .promise()
        .query('UPDATE event_comment SET comment = ?, star = ?, images = ? WHERE id_comment = ?', [
          typeof comment === 'string' ? comment : cm.comment,
          star ?? cm.star,
          imagePath,
          id,
        ]);
    }
    const base = `${req.protocol}://${req.headers.host}/`;
    const toAbs = (p) => (p ? (p.startsWith('http') ? p : base + p) : null);
    let images_list = [];
    if (colExists && groupId) {
      try {
        const [imgRows] = await db.promise().query('SELECT images FROM images WHERE id_images_event = ?', [groupId]);
        images_list = imgRows.map(r => toAbs(r.images));
      } catch(_) {}
    }
    return res.status(200).json({ msg: 'แก้ไขความคิดเห็นสำเร็จ', data: { images: imagePath ? toAbs(imagePath) : (images_list[0] || null), images_list, comment: typeof comment === 'string' ? comment : cm.comment, star: star ?? cm.star } });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถแก้ไขได้', error: err.message });
  }
};

exports.delete_comment = async (req, res) => {
  try {
    await ensureEventCommentImagesSupport();
    const { id } = req.params;
    // cleanup images first
    let groupId = null;
    let imagePath = null;
    try {
      const [rows] = await db.promise().query('SELECT images, id_images_event FROM event_comment WHERE id_comment = ?', [id]);
      if (rows.length > 0) {
        imagePath = rows[0].images || null;
        groupId = rows[0].id_images_event || null;
      }
    } catch(_) {}
    if (groupId) {
      try { await deleteEventImagesGroup(groupId); } catch(_) {}
    }
    if (imagePath && fs.existsSync(imagePath)) {
      try { fs.unlinkSync(imagePath); } catch(_) {}
    }
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
    // Emit realtime event to notify owner of the source comment
    try {
      const [pr2] = await db.promise().query('SELECT id_user FROM event_comment WHERE id_comment = ?', [id_comment]);
      const targetUser = pr2 && pr2[0] ? pr2[0].id_user : null;
      const io = getIO();
      if (io && targetUser) {
        io.emit('new-reply', {
          scope: 'event',
          id_comment,
          id_reply: ins.insertId,
          target_user_id: targetUser,
          reply_user_id: id_user,
          reply_date: now(),
        });
      }
    } catch (_) {}
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

// Get all event comments by a user
exports.get_my_event_comments = async (req, res) => {
  try {
    await ensureTables();
    const { id_user } = req.params;
    if (!id_user) return res.status(400).json({ msg: 'ต้องระบุ id_user' });
    const [rows] = await db
      .promise()
      .query(
        `SELECT ec.id_comment, ec.id_event, ec.date_comment, ec.comment, ec.images, ec.star,
                ue.name_event AS event_name,
                u.first_name AS user_name, u.image_profile AS user_image
         FROM event_comment ec
         JOIN user u ON u.id_user = ec.id_user
         JOIN user_event ue ON ue.id_event = ec.id_event
         WHERE ec.id_user = ? AND (ec.status IS NULL OR ec.status <> '0')
         ORDER BY ec.date_comment DESC`,
        [id_user]
      );
    const data = rows.map((r) => ({
      ...r,
      images: buildFileUrl(req, r.images),
      user_image: buildFileUrl(req, r.user_image),
    }));
    return res.status(200).json({ msg: 'ดึงความคิดเห็นกิจกรรมของผู้ใช้สำเร็จ', data });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงความคิดเห็นได้', error: err.message });
  }
};

// Get all event replies by a user
exports.get_my_event_replies = async (req, res) => {
  try {
    await ensureTables();
    const { id_user } = req.params;
    if (!id_user) return res.status(400).json({ msg: 'ต้องระบุ id_user' });
    const [rows] = await db
      .promise()
      .query(
        `SELECT r.id_reply, r.id_comment, r.reply, r.reply_date, r.user_image,
                ec.id_event, ue.name_event AS event_name
         FROM event_comment_reply r
         JOIN event_comment ec ON ec.id_comment = r.id_comment
         JOIN user_event ue ON ue.id_event = ec.id_event
         WHERE r.id_user = ? AND (r.status IS NULL OR r.status <> '0')
         ORDER BY r.reply_date DESC`,
        [id_user]
      );
    const data = rows.map((r) => ({
      ...r,
      user_image: buildFileUrl(req, r.user_image),
    }));
    return res.status(200).json({ msg: 'ดึงการตอบกลับกิจกรรมของผู้ใช้สำเร็จ', data });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงการตอบกลับได้', error: err.message });
  }
};

// Replies to my event comments
exports.get_event_replies_to_me = async (req, res) => {
  try {
    await ensureTables();
    const { id_user } = req.params;
    if (!id_user) return res.status(400).json({ msg: 'ต้องระบุ id_user' });
    const [rows] = await db
      .promise()
      .query(
        `SELECT r.id_reply, r.id_comment, r.reply, r.reply_date, r.user_image,
                u.first_name AS reply_user_name,
                ec.comment AS comment_text,
                ec.id_event, ue.name_event AS event_name
         FROM event_comment_reply r
         JOIN event_comment ec ON ec.id_comment = r.id_comment
         JOIN user_event ue ON ue.id_event = ec.id_event
         JOIN user u ON u.id_user = r.id_user
         WHERE ec.id_user = ?
           AND (r.status IS NULL OR r.status <> '0')
           AND (ec.status IS NULL OR ec.status <> '0')
         ORDER BY r.reply_date DESC
         LIMIT 50`,
        [id_user]
      );
    const data = rows.map((row) => ({
      ...row,
      reply_date: row.reply_date ? dayjs(row.reply_date).toISOString() : null,
      user_image: buildFileUrl(req, row.user_image),
    }));
    return res.status(200).json({ msg: 'ดึงการตอบกลับมายังคอมเมนต์กิจกรรมของฉันสำเร็จ', data });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงการตอบกลับได้', error: err.message });
  }
};
