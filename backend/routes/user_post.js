const express = require('express');
const { get_post, add_post, edit_post, delete_post, get_post_me } = require('../controller/user_post');
const router = express.Router();


const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');

router.get('/post',get_post);
router.get('/post/:id',get_post_me);
router.post('/post',uploadToPostImg.single("image"),add_post);
router.patch('/post/:id',uploadToPostImg.single("image"),edit_post);
router.delete('/post/:id',delete_post);

module.exports = router;