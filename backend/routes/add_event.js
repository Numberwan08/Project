const express = require('express');
const { get_event, add_event, edit_event, delete_event } = require('../controller/add_event');
const router = express.Router();



const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');


router.get('/event',get_event);
router.post('/event',uploadToPostImg.single,add_event);
router.patch('/event/:id',uploadToPostImg.single,edit_event);
router.delete('/event/:id',delete_event);


module.exports = router;