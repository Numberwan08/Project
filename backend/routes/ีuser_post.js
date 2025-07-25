const express = require('express');
const { get_post, add_post, edit_post, delete_post } = require('../controller/user_post');
const router = express.Router();

router.get('/user',get_post);
router.post('/user',add_post);
router.patch('/user/:id',edit_post);
router.delete('/user/:id',delete_post);

module.exports = router;