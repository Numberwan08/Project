const db = require('../config/db');
const dayjs = require('dayjs');
let getIO;
try { ({ getIO } = require('../socket')); } catch (_) { getIO = () => null; }

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

// Ensure required tables exist (safe no-op if they already exist)
const ensureTables = async () => {
  try {
    await db
      .promise()
      .query(`CREATE TABLE IF NOT EXISTS follows (
        id_follower INT NOT NULL,
        id_following INT NOT NULL,
        created_at DATETIME NULL,
        PRIMARY KEY (id_follower, id_following)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  } catch (_) {}
};

exports.follow = async (req, res) => {
  try {
    await ensureTables();
    const id_following = Number(req.params.id);
    const id_follower = Number(req.body?.id_user || req.query?.id_user);
    if (!id_following || !id_follower) return res.status(400).json({ msg: 'ต้องระบุ id_user และ id ที่ต้องการติดตาม' });
    if (id_following === id_follower) return res.status(400).json({ msg: 'ไม่สามารถติดตามตัวเองได้' });
    await db.promise().query(
      'INSERT IGNORE INTO follows (id_follower, id_following, created_at) VALUES (?,?,?)',
      [id_follower, id_following, now()]
    );
    try {
      const io = getIO && getIO();
      if (io) io.emit('follow-new', { target_user_id: id_following, follower_id: id_follower, created_at: now() });
    } catch (_) {}
    return res.status(200).json({ msg: 'ติดตามสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถติดตามได้', error: err.message });
  }
};

exports.unfollow = async (req, res) => {
  try {
    await ensureTables();
    const id_following = Number(req.params.id);
    const id_follower = Number(req.body?.id_user || req.query?.id_user);
    if (!id_following || !id_follower) return res.status(400).json({ msg: 'ต้องระบุ id_user และ id ที่ต้องการเลิกติดตาม' });
    const [r] = await db.promise().query('DELETE FROM follows WHERE id_follower = ? AND id_following = ?', [id_follower, id_following]);
    if (r.affectedRows === 0) return res.status(404).json({ msg: 'ไม่พบรายการติดตาม' });
    return res.status(200).json({ msg: 'เลิกติดตามสำเร็จ' });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถเลิกติดตามได้', error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    await ensureTables();
    const id = Number(req.params.id);
    const [rows] = await db
      .promise()
      .query(
        `SELECT f.id_follower AS id_user, u.first_name, u.image_profile
         FROM follows f JOIN user u ON u.id_user = f.id_follower
         WHERE f.id_following = ? ORDER BY f.created_at DESC`,
        [id]
      );
    return res.status(200).json({ msg: 'ดึงผู้ติดตามสำเร็จ', data: rows || [] });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงผู้ติดตามได้', error: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    await ensureTables();
    const id = Number(req.params.id);
    const [rows] = await db
      .promise()
      .query(
        `SELECT f.id_following AS id_user, u.first_name, u.image_profile
         FROM follows f JOIN user u ON u.id_user = f.id_following
         WHERE f.id_follower = ? ORDER BY f.created_at DESC`,
        [id]
      );
    return res.status(200).json({ msg: 'ดึงผู้ที่กำลังติดตามสำเร็จ', data: rows || [] });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงข้อมูลได้', error: err.message });
  }
};

exports.feed = async (req, res) => {
  try {
    await ensureTables();
    const id_user = Number(req.params.id_user);
    const [rows] = await db
      .promise()
      .query(
        `SELECT 'post' AS type, p.id_post AS id, p.name_location AS title, p.images, p.date AS created_at
           FROM user_post p WHERE p.id_user IN (SELECT id_following FROM follows WHERE id_follower = ?)
         UNION ALL
         SELECT 'event' AS type, e.id_event AS id, e.name_event AS title, e.images, e.date_start AS created_at
           FROM user_event e WHERE e.id_user IN (SELECT id_following FROM follows WHERE id_follower = ?)
         ORDER BY created_at DESC LIMIT 50`,
        [id_user, id_user]
      );
    return res.status(200).json({ msg: 'ดึงฟีดสำเร็จ', data: rows || [] });
  } catch (err) {
    return res.status(500).json({ msg: 'ไม่สามารถดึงฟีดได้', error: err.message });
  }
};
