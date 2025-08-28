const express = require('express');
const { get_post, add_post, edit_post, delete_post, get_post_me, post_att, likes, likes_check } = require('../controller/user_post');
const router = express.Router();


const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');

router.get('/post',get_post);
router.get('/post/:id',get_post_me);
router.post('/post',uploadToPostImg.single("image"),add_post);
router.patch('/post/:id',uploadToPostImg.single("image"),edit_post);
router.delete('/post/:id',delete_post);
router.get("/post_att/:id",post_att);
router.post("/post/likes/:id",likes);

// ตรวจสอบสถานะไลค์โพสต์ (id_post, id_user)
router.get("/post/likes/check/:id_post/:id_user", likes_check);

// ยกเลิกไลค์โพสต์ (unlike)
router.delete("/post/likes/:id_post/:id_user", require('../controller/user_post').unlike);

module.exports = router;