const express = require('express');
const { get_prodact, add_prodact, delete_prodact, edit_prodact } = require('../controller/add_prodact');
const router = express.Router();


const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');

router.get('/prodact',get_prodact);
router.post('/prodact',uploadToPostImg.single,add_prodact);
router.patch('/prodact/:id',uploadToPostImg.single,edit_prodact);
router.delete('/prodact/:id',delete_prodact);

module.exports = router;