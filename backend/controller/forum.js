const db = require('../config/db');
const dayjs = require('dayjs');
let getIO; try { ({ getIO } = require('../socket')); } catch (_) { getIO = () => null; }

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

// const ensureTables = async () => {
//   try {
//     await db.promise().query(`CREATE TABLE IF NOT EXISTS threads (
//       id_thread INT NOT NULL AUTO_INCREMENT,
//       title VARCHAR(255) NOT NULL,
//       creator_id INT NOT NULL,
//       created_at DATETIME NULL,
//       PRIMARY KEY (id_thread)
//     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
//     await db.promise().query(`CREATE TABLE IF NOT EXISTS thread_posts (
//       id_post INT NOT NULL AUTO_INCREMENT,
//       id_thread INT NOT NULL,
//       id_user INT NOT NULL,
//       content TEXT NOT NULL,
//       created_at DATETIME NULL,
//       PRIMARY KEY (id_post)
//     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
//   } catch (_) {}
// };

exports.createThread = async (req, res) => {
  try {
    await ensureTables();
    const { title, creator_id } = req.body || {};
    const t = (title || '').trim();
    if (!t || !creator_id) return res.status(400).json({ msg: 'ต้องระบุชื่อกระทู้และผู้สร้าง' });
    const [r] = await db.promise().query(
      'INSERT INTO threads (title, creator_id, created_at) VALUES (?,?,?)',
      [t, creator_id, now()]
    );
    return res.status(201).json({ msg: 'สร้างกระทู้สำเร็จ', data: { id_thread: r.insertId } });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถสร้างกระทู้ได้', error: err.message });
  }
};

exports.listThreads = async (req, res) => {
  try {
    await ensureTables();
    const [rows] = await db.promise().query(
      `SELECT t.*, u.first_name FROM threads t LEFT JOIN user u ON u.id_user = t.creator_id ORDER BY t.created_at DESC LIMIT 100`
    );
    return res.status(200).json({ msg: 'ดึงกระทู้สำเร็จ', data: rows || [] });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงกระทู้ได้', error: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    await ensureTables();
    const id_thread = Number(req.params.id_thread);
    const { id_user, content } = req.body || {};
    const c = (content || '').trim();
    if (!id_thread || !id_user || !c) return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน' });
    const [chk] = await db.promise().query('SELECT id_thread FROM threads WHERE id_thread = ?', [id_thread]);
    if (chk.length === 0) return res.status(404).json({ msg: 'ไม่พบบอร์ดสนทนา' });
    const [r] = await db.promise().query(
      'INSERT INTO thread_posts (id_thread, id_user, content, created_at) VALUES (?,?,?,?)',
      [id_thread, id_user, c, now()]
    );
    try {
      const io = getIO && getIO();
      if (io) io.emit('thread-post-new', { id_thread, id_post: r.insertId, id_user, content: c, created_at: now() });
    } catch (_) {}
    return res.status(201).json({ msg: 'ตอบกระทู้สำเร็จ', data: { id_post: r.insertId } });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถตอบกระทู้ได้', error: err.message });
  }
};

exports.listPosts = async (req, res) => {
  try {
    await ensureTables();
    const id_thread = Number(req.params.id_thread);
    const [rows] = await db.promise().query(
      `SELECT p.*, u.first_name FROM thread_posts p LEFT JOIN user u ON u.id_user = p.id_user WHERE p.id_thread = ? ORDER BY p.created_at ASC`,
      [id_thread]
    );
    return res.status(200).json({ msg: 'ดึงโพสต์ในกระทู้สำเร็จ', data: rows || [] });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงโพสต์ได้', error: err.message });
  }
};

