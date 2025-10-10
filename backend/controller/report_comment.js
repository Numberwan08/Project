const db = require('../config/db');
const dayjs = require('dayjs');

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

// Ensure report_comment table has needed columns
const ensureReportTable = async () => {
  try {
    await db
      .promise()
      .query(
        `CREATE TABLE IF NOT EXISTS report_comment (
          id_report_comment INT NOT NULL AUTO_INCREMENT,
          id_commnet INT NULL,
          id_post INT NULL,
          id_user INT NULL,
          id_reply INT NULL,
          detail_report VARCHAR(1000) NULL,
          PRIMARY KEY (id_report_comment)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8`
      );
  } catch (e) {}

  const addCol = async (sql) => {
    try {
      await db.promise().query(sql);
    } catch (e) {
      // ignore if already exists or not supported
    }
  };

  // Add reason, status, target_user_id, created_at if missing
  await addCol("ALTER TABLE report_comment ADD COLUMN reason VARCHAR(255) NULL");
  await addCol("ALTER TABLE report_comment ADD COLUMN status TINYINT(1) NULL DEFAULT 1");
  await addCol("ALTER TABLE report_comment ADD COLUMN target_user_id INT NULL");
  await addCol("ALTER TABLE report_comment ADD COLUMN created_at DATETIME NULL");
};

const findCommentOwner = async (id_comment) => {
  const [rows] = await db
    .promise()
    .query('SELECT id_user, id_post FROM comment_post WHERE id_comment = ?', [id_comment]);
  return rows[0] || null;
};

const findReplyOwner = async (id_reply) => {
  const [rows] = await db
    .promise()
    .query('SELECT id_user, id_comment FROM comment_reply WHERE id_reply = ?', [id_reply]);
  return rows[0] || null;
};

exports.createReportForComment = async (req, res) => {
  try {
    await ensureReportTable();
    const { id_comment, id_post, id_user, reason, details } = req.body;

    if (!id_comment || !id_post || !id_user || !reason) {
      return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน', error: 'ต้องระบุ id_comment, id_post, id_user, reason' });
    }

    // find target user (comment owner)
    const owner = await findCommentOwner(id_comment);
    if (!owner) {
      return res.status(404).json({ msg: 'ไม่พบความคิดเห็นที่จะรายงาน' });
    }

    const [result] = await db
      .promise()
      .query(
        `INSERT INTO report_comment (id_commnet, id_post, id_user, detail_report, reason, status, target_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id_comment, id_post, id_user, details || null, reason, 1, owner.id_user || null, now()]
      );

    return res.status(201).json({
      msg: 'ส่งรายงานความคิดเห็นสำเร็จ',
      data: { id_report_comment: result.insertId }
    });
  } catch (err) {
    console.log('createReportForComment error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถส่งรายงานได้', error: err.message });
  }
};

exports.createReportForReply = async (req, res) => {
  try {
    await ensureReportTable();
    const { id_reply, id_comment, id_post, id_user, reason, details } = req.body;
    if (!id_reply || !id_comment || !id_post || !id_user || !reason) {
      return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน', error: 'ต้องระบุ id_reply, id_comment, id_post, id_user, reason' });
    }

    const owner = await findReplyOwner(id_reply);
    if (!owner || String(owner.id_comment) !== String(id_comment)) {
      return res.status(404).json({ msg: 'ไม่พบการตอบกลับที่จะรายงาน' });
    }

    const [result] = await db
      .promise()
      .query(
        `INSERT INTO report_comment (id_reply, id_commnet, id_post, id_user, detail_report, reason, status, target_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id_reply, id_comment, id_post, id_user, details || null, reason, 1, owner.id_user || null, now()]
      );

    return res.status(201).json({
      msg: 'ส่งรายงานการตอบกลับสำเร็จ',
      data: { id_report_comment: result.insertId }
    });
  } catch (err) {
    console.log('createReportForReply error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถส่งรายงานได้', error: err.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    await ensureReportTable();
    const [rows] = await db
      .promise()
      .query(
        `SELECT 
           rc.id_report_comment,
           rc.id_commnet AS id_comment,
           rc.id_reply,
           rc.id_post,
           rc.id_user AS reporter_id,
           ru.first_name AS reporter_name,
           rc.target_user_id,
           tu.first_name AS target_name,
           rc.reason,
           rc.detail_report,
           rc.status,
           rc.created_at,
           cp.comment AS comment_text,
           cr.reply AS reply_text,
           up.name_location AS post_name
         FROM report_comment rc
         LEFT JOIN user ru ON ru.id_user = rc.id_user
         LEFT JOIN user tu ON tu.id_user = rc.target_user_id
         LEFT JOIN comment_post cp ON cp.id_comment = rc.id_commnet
         LEFT JOIN comment_reply cr ON cr.id_reply = rc.id_reply
         LEFT JOIN user_post up ON up.id_post = rc.id_post
         ORDER BY rc.created_at DESC, rc.id_report_comment DESC`
      );

    return res.status(200).json({ msg: 'ดึงข้อมูลรายงานสำเร็จ', data: rows || [] });
  } catch (err) {
    console.log('getAllReports error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถดึงข้อมูลรายงานได้', error: err.message });
  }
};

exports.getReportsForUser = async (req, res) => {
  try {
    await ensureReportTable();
    const { userId } = req.params;
    const [rows] = await db
      .promise()
      .query(
        `SELECT 
           rc.id_report_comment,
           rc.id_commnet AS id_comment,
           rc.id_reply,
           rc.id_post,
           rc.reason,
           rc.detail_report,
           rc.status,
           rc.created_at
         FROM report_comment rc
         WHERE rc.target_user_id = ?
         ORDER BY rc.created_at DESC, rc.id_report_comment DESC`,
        [userId]
      );
    return res.status(200).json({ msg: 'ดึงข้อมูลรายงานของฉันสำเร็จ', data: rows || [] });
  } catch (err) {
    console.log('getReportsForUser error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถดึงข้อมูลรายงานได้', error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    await ensureReportTable();
    const { id } = req.params;
    let { status } = req.body;
    if (status === undefined || status === null) {
      return res.status(400).json({ msg: 'ต้องระบุสถานะ', error: 'status required' });
    }
    status = Number(status);
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง', error: 'status must be 0 or 1' });
    }

    // Get report
    const [rows] = await db
      .promise()
      .query('SELECT * FROM report_comment WHERE id_report_comment = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ msg: 'ไม่พบรายงาน' });
    const rc = rows[0];

    // Update report status
    await db
      .promise()
      .query('UPDATE report_comment SET status = ? WHERE id_report_comment = ?', [status, id]);

    // Apply visibility to target entity
    if (rc.id_commnet) {
      // comment
      await db
        .promise()
        .query('UPDATE comment_post SET status = ? WHERE id_comment = ?', [status === 0 ? '0' : '1', rc.id_commnet]);
    } else if (rc.id_reply) {
      // reply
      await db
        .promise()
        .query('UPDATE comment_reply SET status = ? WHERE id_reply = ?', [status === 0 ? '0' : '1', rc.id_reply]);
    }

    return res.status(200).json({ msg: 'อัปเดตสถานะรายงานสำเร็จ' });
  } catch (err) {
    console.log('updateReportStatus error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะรายงานได้', error: err.message });
  }
};
