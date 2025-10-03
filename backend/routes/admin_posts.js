const express = require('express');
const { 
    get_posts, 
    get_post_by_id, 
    add_post, 
    edit_post, 
    delete_post, 
    get_categories 
} = require('../controller/admin_posts');
const uploadTo = require('../middleware/upload');
const authtoken = require('../middleware/checktoken');
const router = express.Router();
const uploadToPostImg = uploadTo('post_image');
router.get('/posts', get_posts);
router.get('/posts/categories', get_categories);
router.get('/posts/:id', get_post_by_id);
router.post('/admin/posts', authtoken, uploadToPostImg.single("image"), add_post);
router.patch('/admin/posts/:id', authtoken, uploadToPostImg.single("image"), edit_post);
router.delete('/admin/posts/:id', authtoken, delete_post);

module.exports = router;
