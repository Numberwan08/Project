const express = require('express');
const { member } = require('../controller/user');

const router = express.Router();

router.get('/member',member);

module.exports = router; 