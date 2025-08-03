const express = require('express');
const { member, allmember } = require('../controller/user');

const router = express.Router();

router.get('/member',member);
router.get('/allmember',allmember);

module.exports = router; 