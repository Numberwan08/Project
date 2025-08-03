const express = require('express');
const { get_event, add_event, edit_event, delete_event, get_event_me, get_events } = require('../controller/add_event');
const router = express.Router();



const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');


router.get('/event',get_event);
router.get('/event/:id',get_event_me);
router.get('/get_event/:id',get_events);
router.post('/event',uploadToPostImg.single ("image"),add_event);
router.patch('/event/:id',uploadToPostImg.single("image"),edit_event);
router.delete('/event/:id',delete_event);


module.exports = router;