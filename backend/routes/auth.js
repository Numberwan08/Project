const express = require('express');
const { register, login, adminRegister } = require('../controller/auth');

const router = express.Router();

router.post('/register',register);
router.post("/login",login);
router.post("/admin",adminRegister)
module.exports = router;