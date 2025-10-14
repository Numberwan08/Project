const express = require('express');
const router = express.Router();

const uploadTo = require('../middleware/upload');
const uploadComment = uploadTo('event_comment_image');
const uploadReply = uploadTo('event_reply_image');

const ec = require('../controller/event_comment');

router.post('/event/comment/:id_event', uploadComment.single('image'), ec.add_comment);
router.get('/event/comment_id/:id_event', ec.get_comments);
router.patch('/event/comment/:id', uploadComment.single('image'), ec.edit_comment);
router.delete('/event/delete_comment/:id', ec.delete_comment);
router.post('/event/comment/:id_comment/replies', uploadReply.single('image'), ec.add_reply);
router.get('/event/comment/:id_comment/replies', ec.get_replies);
router.patch('/event/comment/:id_comment/replies/:id_reply', uploadReply.single('image'), ec.edit_reply);
router.delete('/event/comment/:id_comment/replies/:id_reply', ec.delete_reply);
router.patch('/event/comment_status/:id_comment', ec.set_comment_status);
router.patch('/event/reply_status/:id_reply', ec.set_reply_status);
// My event comments
router.get('/event/comments/me/:id_user', ec.get_my_event_comments);
// My event replies
router.get('/event/replies/me/:id_user', ec.get_my_event_replies);

module.exports = router;
