const express = require('express');
const { get_prodact, add_prodact, delete_prodact, edit_prodact } = require('../controller/add_prodact');
const router = express.Router();

router.get('/prodact',get_prodact);
router.post('/prodact',add_prodact);
router.patch('/prodact/:id',edit_prodact);
router.delete('/prodact/:id',delete_prodact);

module.exports = router;