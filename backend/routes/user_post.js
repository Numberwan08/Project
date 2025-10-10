// ดึงสถานที่ใกล้เคียง

const express = require('express');
const { get_post, add_post, edit_post, delete_post, get_post_me, get_single_post,
likes, likes_check,nearby, comment_post,get_comment,
count_comment,delete_comment, get_post_types, create_post_type, update_post_type, delete_post_type,
get_type_name } = require('../controller/user_post');
const router = express.Router();


const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');

router.get('/post',get_post);
router.get('/post/types', get_post_types); 
router.post('/post/type', create_post_type);
router.patch('/post/type/:id', update_post_type);
router.delete('/post/type/:id', delete_post_type);
router.get('/post_att/:id',require('../controller/user_post').post_att);
router.get('/post/user/:id',get_post_me); 
router.get('/post/single/:id',get_single_post); 
router.post('/post',uploadToPostImg.single("image"),add_post);
router.patch('/post/:id',uploadToPostImg.single("image"),edit_post);
router.delete('/post/:id',delete_post);
router.post("/post/likes/:id",likes);
router.get('/nearby/:id',nearby);
router.get("/post/likes/check/:id_post/:id_user", likes_check);
router.delete("/post/likes/:id_post/:id_user", require('../controller/user_post').unlike);
router.post("/post/comment/:id_post",uploadToPostImg.single("image"),comment_post);
router.patch("/post/comment/:id", uploadToPostImg.single("image"), require('../controller/user_post').edit_comment);
router.get("/post/comment_id/:id_post",get_comment);
router.get("/post/comment_status/:id_comment", require('../controller/user_post').get_comment_status);
router.get("/post/count_comment/:id_post",count_comment);
router.delete("/delete_comment/:id",delete_comment);
router.get("/type_name",get_type_name);
// Status endpoints for comment/reply visibility
router.patch('/post/comment_status/:id_comment', require('../controller/user_post').set_comment_status);
router.patch('/post/reply_status/:id_reply', require('../controller/comment').set_reply_status);

module.exports = router;
