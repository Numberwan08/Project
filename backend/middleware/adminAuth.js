const jwt = require('jsonwebtoken');

// Verify admin token issued by adminLogin (controller/auth.js) which uses secret 'token'
module.exports = function adminAuth(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    // Verify with the same secret used in adminLogin
    jwt.verify(token, 'token', (err, payload) => {
      if (err) return res.status(403).json({ msg: 'Invalid or expired token' });
      // minimal payload: { username, first_name }
      req.admin = payload;
      next();
    });
  } catch (e) {
    return res.status(500).json({ msg: 'Auth error', error: e.message });
  }
}

