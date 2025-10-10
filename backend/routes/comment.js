const express = require('express');
const router = express.Router();

const commentController = require('../controller/comment');

router.post('/comment/:id_comment/replies', commentController.add_reply);
router.get('/comment/:id_comment/replies', commentController.get_replies);

module.exports = router;
