const express = require('express');
const { get_prodact, add_prodact, delete_prodact, edit_prodact, get_product_me } = require('../controller/add_prodact');
const router = express.Router();


const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');

router.get('/product',get_prodact);
router.get('/product/:id',get_product_me);
router.post('/product',uploadToPostImg.single("image"),add_prodact);
router.patch('/product/:id',uploadToPostImg.single("image"),edit_prodact);
router.delete('/product/:id',delete_prodact);

module.exports = router;