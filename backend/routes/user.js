const express = require('express');
const { member, allmember, getProfile } = require('../controller/user');

const router = express.Router();

router.get('/member',member);
router.get('/allmember',allmember);
// single profile by id
router.get('/profile/:id', getProfile);

module.exports = router; 
