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
  // Event-related columns (safe-add)
  await addCol("ALTER TABLE report_comment ADD COLUMN id_event_comment INT NULL");
  await addCol("ALTER TABLE report_comment ADD COLUMN id_event_reply INT NULL");
  await addCol("ALTER TABLE report_comment ADD COLUMN id_event INT NULL");
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

// Event owners
const findEventCommentOwner = async (id_event_comment) => {
  const [rows] = await db
    .promise()
    .query('SELECT id_user, id_event FROM event_comment WHERE id_comment = ?', [id_event_comment]);
  return rows[0] || null;
};

const findEventReplyOwner = async (id_event_reply) => {
  const [rows] = await db
    .promise()
    .query('SELECT id_user, id_comment FROM event_comment_reply WHERE id_reply = ?', [id_event_reply]);
  return rows[0] || null;
};

exports.createReportForComment = async (req, res) => {
  try {
    await ensureReportTable();
    const { id_comment, id_post, id_user, reason, details } = req.body;

    if (!id_comment || !id_post || !id_user || !reason) {
      return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน', error: 'ต้องระบุ id_comment, id_post, id_user, reason' });
    }

    // Prevent duplicate report by the same user for the same comment
    const [dup] = await db
      .promise()
      .query('SELECT id_report_comment FROM report_comment WHERE id_user = ? AND id_commnet = ? LIMIT 1', [id_user, id_comment]);
    if (dup.length > 0) {
      return res.status(409).json({ msg: 'คุณได้รายงานความคิดเห็นนี้แล้ว' });
    }

    // find target user (comment owner)
    const owner = await findCommentOwner(id_comment);
    if (!owner) {
      return res.status(404).json({ msg: 'ไม่พบความคิดเห็นที่จะรายงาน' });
    }
    // Disallow reporting own comment
    if (String(owner.id_user) === String(id_user)) {
      return res.status(400).json({ msg: 'ไม่สามารถรายงานความคิดเห็นของตนเองได้' });
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

// Event: create report for comment
exports.createEventReportForComment = async (req, res) => {
  try {
    await ensureReportTable();
    const { id_event_comment, id_event, id_user, reason, details } = req.body;

    if (!id_event_comment || !id_event || !id_user || !reason) {
      return res.status(400).json({ msg: '���������ú��ǹ', error: '��ͧ�к� id_event_comment, id_event, id_user, reason' });
    }

    const [dup] = await db
      .promise()
      .query('SELECT id_report_comment FROM report_comment WHERE id_user = ? AND id_event_comment = ? LIMIT 1', [id_user, id_event_comment]);
    if (dup.length > 0) {
      return res.status(409).json({ msg: '�س����§ҹ�����Դ��繹������' });
    }

    const owner = await findEventCommentOwner(id_event_comment);
    if (!owner) {
      return res.status(404).json({ msg: '��辺�����Դ��繷�����§ҹ' });
    }
    if (String(owner.id_user) === String(id_user)) {
      return res.status(400).json({ msg: '�������ö��§ҹ�����Դ��繢ͧ���ͧ��' });
    }

    const [result] = await db
      .promise()
      .query(
        `INSERT INTO report_comment (id_event_comment, id_event, id_user, detail_report, reason, status, target_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id_event_comment, id_event, id_user, details || null, reason, 1, owner.id_user || null, now()]
      );

    return res.status(201).json({ msg: '����§ҹ�����Դ��������', data: { id_report_comment: result.insertId } });
  } catch (err) {
    console.log('createEventReportForComment error:', err);
    return res.status(500).json({ msg: '�������ö����§ҹ��', error: err.message });
  }
};

// Event: create report for reply
exports.createEventReportForReply = async (req, res) => {
  try {
    await ensureReportTable();
    const { id_event_reply, id_event_comment, id_event, id_user, reason, details } = req.body;
    if (!id_event_reply || !id_event_comment || !id_event || !id_user || !reason) {
      return res.status(400).json({ msg: '���������ú��ǹ', error: '��ͧ�к� id_event_reply, id_event_comment, id_event, id_user, reason' });
    }

    const owner = await findEventReplyOwner(id_event_reply);
    if (!owner || String(owner.id_comment) !== String(id_event_comment)) {
      return res.status(404).json({ msg: '��辺��õͺ��Ѻ������§ҹ' });
    }

    const [result] = await db
      .promise()
      .query(
        `INSERT INTO report_comment (id_event_reply, id_event_comment, id_event, id_user, detail_report, reason, status, target_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id_event_reply, id_event_comment, id_event, id_user, details || null, reason, 1, owner.id_user || null, now()]
      );

    return res.status(201).json({ msg: '����§ҹ��õͺ��Ѻ�����', data: { id_report_comment: result.insertId } });
  } catch (err) {
    console.log('createEventReportForReply error:', err);
    return res.status(500).json({ msg: '�������ö����§ҹ��', error: err.message });
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
           rc.id_event_comment,
           rc.id_event_reply,
           rc.id_event,
           rc.id_user AS reporter_id,
           ru.first_name AS reporter_name,
           rc.target_user_id,
           tu.first_name AS target_name,
           rc.reason,
           rc.detail_report,
           rc.status,
           rc.created_at,
           COALESCE(cp.comment, ec.comment) AS comment_text,
           COALESCE(cr.reply, er.reply) AS reply_text,
           up.name_location AS post_name,
           ue.name_event AS event_name,
           CASE WHEN rc.id_event_comment IS NOT NULL OR rc.id_event_reply IS NOT NULL THEN 'event' ELSE 'post' END AS source
         FROM report_comment rc
         LEFT JOIN user ru ON ru.id_user = rc.id_user
         LEFT JOIN user tu ON tu.id_user = rc.target_user_id
         LEFT JOIN comment_post cp ON cp.id_comment = rc.id_commnet
         LEFT JOIN comment_reply cr ON cr.id_reply = rc.id_reply
         LEFT JOIN event_comment ec ON ec.id_comment = rc.id_event_comment
         LEFT JOIN event_comment_reply er ON er.id_reply = rc.id_event_reply
         LEFT JOIN user_post up ON up.id_post = rc.id_post
         LEFT JOIN user_event ue ON ue.id_event = rc.id_event
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
           rc.id_event_comment,
           rc.id_event_reply,
           rc.id_event,
           rc.id_user AS reporter_id,
           ru.first_name AS reporter_name,
           rc.reason,
           rc.detail_report,
           rc.status,
           rc.created_at,
           up.name_location AS post_name,
           ue.name_event AS event_name,
           ucm.first_name AS comment_owner_name,
           urm.first_name AS reply_owner_name,
           uecm.first_name AS event_comment_owner_name,
           uerm.first_name AS event_reply_owner_name,
           CASE WHEN rc.id_event_comment IS NOT NULL OR rc.id_event_reply IS NOT NULL THEN 'event' ELSE 'post' END AS source
         FROM report_comment rc
         LEFT JOIN user ru ON ru.id_user = rc.id_user
         LEFT JOIN user_post up ON up.id_post = rc.id_post
         LEFT JOIN user_event ue ON ue.id_event = rc.id_event
         LEFT JOIN comment_post cpm ON cpm.id_comment = rc.id_commnet
         LEFT JOIN user ucm ON ucm.id_user = cpm.id_user
         LEFT JOIN comment_reply rpl ON rpl.id_reply = rc.id_reply
         LEFT JOIN user urm ON urm.id_user = rpl.id_user
         LEFT JOIN event_comment ecm ON ecm.id_comment = rc.id_event_comment
         LEFT JOIN user uecm ON uecm.id_user = ecm.id_user
         LEFT JOIN event_comment_reply er ON er.id_reply = rc.id_event_reply
         LEFT JOIN user uerm ON uerm.id_user = er.id_user
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
    } else if (rc.id_event_comment) {
      await db
        .promise()
        .query('UPDATE event_comment SET status = ? WHERE id_comment = ?', [status === 0 ? '0' : '1', rc.id_event_comment]);
    } else if (rc.id_event_reply) {
      await db
        .promise()
        .query('UPDATE event_comment_reply SET status = ? WHERE id_reply = ?', [status === 0 ? '0' : '1', rc.id_event_reply]);
    }

    return res.status(200).json({ msg: 'อัปเดตสถานะรายงานสำเร็จ' });
  } catch (err) {
    console.log('updateReportStatus error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะรายงานได้', error: err.message });
  }
};

// Reports submitted by a reporter (id_user)
exports.getReportsByReporter = async (req, res) => {
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
           rc.id_event_comment,
           rc.id_event_reply,
           rc.id_event,
           rc.reason,
           rc.detail_report,
           rc.status,
           rc.created_at,
           CASE WHEN rc.id_event_comment IS NOT NULL OR rc.id_event_reply IS NOT NULL THEN 'event' ELSE 'post' END AS source
         FROM report_comment rc
         WHERE rc.id_user = ?
         ORDER BY rc.created_at DESC, rc.id_report_comment DESC`,
        [userId]
      );
    return res.status(200).json({ msg: 'ดึงข้อมูลรายงานที่ฉันส่งสำเร็จ', data: rows || [] });
  } catch (err) {
    console.log('getReportsByReporter error:', err);
    return res.status(500).json({ msg: 'ไม่สามารถดึงข้อมูลรายงานของฉันได้', error: err.message });
  }
};


exports.getHistoryReport = async (req, res) => { 
  const { id } = req.params; // reporter id_user
  try {
    if (typeof ensureReportTable === 'function') {
      await ensureReportTable();
    }
    const [rows] = await db
      .promise()
      .query(
        `SELECT 
            rc.id_report_comment,
            rc.id_commnet AS id_comment,
            rc.id_reply,
            rc.id_post,
            rc.id_event_comment,
            rc.id_event_reply,
            rc.id_event,
            rc.id_user AS reporter_id,
            ru.first_name AS reporter_name,
            rc.target_user_id,
            tu.first_name AS target_name,
            rc.reason,
            rc.detail_report,
            rc.status,
            rc.created_at,
            COALESCE(cp.comment, ec.comment) AS comment_text,
            COALESCE(cr.reply, er.reply) AS reply_text,
            up.name_location AS post_name,
            ue.name_event AS event_name,
            CASE WHEN rc.id_event_comment IS NOT NULL OR rc.id_event_reply IS NOT NULL THEN 'event' ELSE 'post' END AS source
         FROM report_comment rc
         LEFT JOIN user ru ON ru.id_user = rc.id_user
         LEFT JOIN user tu ON tu.id_user = rc.target_user_id
         LEFT JOIN comment_post cp ON cp.id_comment = rc.id_commnet
         LEFT JOIN comment_reply cr ON cr.id_reply = rc.id_reply
         LEFT JOIN user_post up ON up.id_post = rc.id_post
         LEFT JOIN event_comment ec ON ec.id_comment = rc.id_event_comment
         LEFT JOIN event_comment_reply er ON er.id_reply = rc.id_event_reply
         LEFT JOIN user_event ue ON ue.id_event = rc.id_event
         WHERE rc.id_user = ?
         ORDER BY rc.created_at DESC, rc.id_report_comment DESC`,
        [id]
      );

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'ไม่พบรายงาน' });
    }

    return res.status(200).json({ msg: 'ดึงข้อมูลรายงานที่ฉันส่งสำเร็จ', data: rows });
  } catch (err) {
    console.log("getHistoryReport error:" , err);
    return res.status(500).json({ msg: 'ไม่สามารถดึงข้อมูลรายงานของฉันได้', error: err.message });
  }
}


