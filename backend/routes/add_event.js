const express = require('express');
const { get_event, add_event, edit_event, delete_event, get_event_me, get_events, likes, likes_check , unlike, nearby_event } = require('../controller/add_event');
const router = express.Router();

const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');
const adminAuth = require('../middleware/adminAuth');

router.get('/event',get_event);
router.get('/event/:id',get_event_me);
router.get('/get_event/:id',get_events);
router.post('/event', adminAuth, uploadToPostImg.single ("image"), add_event);
router.patch('/event/:id', adminAuth, uploadToPostImg.single("image"), edit_event);
router.delete('/event/:id', adminAuth, delete_event);
router.post("/event/likes/:id", likes);
router.get("/event/likes/check/:id_event/:id_user", likes_check);
router.delete("/event/likes/:id_event/:id_user",unlike);
router.get('/nearby_event/:id',nearby_event);

module.exports = router;
