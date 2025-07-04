const express = require('express');
const { register, login, adminRegister, adminLogin, checktoken } = require('../controller/auth');
const authtoken = require('../middleware/checktoken');

const router = express.Router();

router.post('/register',register);
router.post("/login",login);
router.post("/admin",adminRegister)
router.post("/admin/login",adminLogin);
router.post("/checktoken",authtoken,checktoken);

module.exports = router;