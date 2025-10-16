const express = require('express');
const router = express.Router();

const f = require('../controller/forum');

router.post('/forum/thread', f.createThread);
router.get('/forum/thread', f.listThreads);
router.get('/forum/thread/:id_thread/posts', f.listPosts);
router.post('/forum/thread/:id_thread/posts', f.createPost);

module.exports = router;

