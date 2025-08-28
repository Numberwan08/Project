const express = require('express');
const { get_event, add_event, edit_event, delete_event, get_event_me, get_events, likes, likes_check , unlike } = require('../controller/add_event');
const router = express.Router();



const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');


router.get('/event',get_event);
router.get('/event/:id',get_event_me);
router.get('/get_event/:id',get_events);
router.post('/event',uploadToPostImg.single ("image"),add_event);
router.patch('/event/:id',uploadToPostImg.single("image"),edit_event);
router.delete('/event/:id',delete_event);
router.post("/event/likes/:id", likes);
// ตรวจสอบสถานะไลค์โพสต์ (id_event, id_user)
router.get("/event/likes/check/:id_event/:id_user", likes_check);
// ยกเลิกไลค์โพสต์ (unlike)
router.delete("/event/likes/:id_event/:id_user",unlike);

module.exports = router;