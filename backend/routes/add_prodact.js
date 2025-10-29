const express = require('express');
const { get_prodact, add_prodact, delete_prodact, edit_prodact, get_product_me, get_product_id, nearby_product, get_products_by_post, get_random_products_by_post, get_pending_products, get_rejected_products, update_product_status } = require('../controller/add_prodact');
const router = express.Router();


const uploadTo = require('../middleware/upload');
const uploadToPostImg = uploadTo('post_image');

router.get('/product',get_prodact);
router.get('/product/pending', get_pending_products);
router.get('/product/rejected', get_rejected_products);
router.get('/product/:id',get_product_me);
router.get('/get_product/:id',get_product_id);
router.get('/products_by_post/:id_post',get_products_by_post);
router.get('/random_products_by_post/:id_post',get_random_products_by_post);
router.post('/product',uploadToPostImg.single("image"),add_prodact);
router.patch('/product/:id',uploadToPostImg.single("image"),edit_prodact);
router.patch('/product/:id/status', update_product_status);
router.delete('/product/:id',uploadToPostImg.single("image"),delete_prodact);
router.get('/nearby_product/:id',nearby_product);

module.exports = router;
