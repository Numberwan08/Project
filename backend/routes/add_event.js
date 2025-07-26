const express = require('express');
const { get_event, add_event, edit_event, delete_event } = require('../controller/add_event');

const router = express.Router();

router.get('/event',get_event);
router.post('/event',add_event);
router.patch('/event/:id',edit_event);
router.delete('/event/:id',delete_event);


module.exports = router;