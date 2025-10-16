const express = require('express');
const router = express.Router();

const s = require('../controller/social');

router.post('/social/follow/:id', s.follow);
router.delete('/social/follow/:id', s.unfollow);
router.get('/social/followers/:id', s.getFollowers);
router.get('/social/following/:id', s.getFollowing);
router.get('/social/feed/:id_user', s.feed);

module.exports = router;

