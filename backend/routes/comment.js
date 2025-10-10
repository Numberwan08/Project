const express = require('express');
const router = express.Router();

const commentController = require('../controller/comment');
const uploadTo = require('../middleware/upload');
const uploadToReply = uploadTo('reply_image');
router.post('/comment/:id_comment/replies', uploadToReply.single('image'), commentController.add_reply);
router.get('/comment/:id_comment/replies', commentController.get_replies);
router.patch('/comment/:id_comment/replies/:id_reply', uploadToReply.single('image'), commentController.edit_reply);
router.delete('/comment/:id_comment/replies/:id_reply', commentController.delete_reply);

module.exports = router;
