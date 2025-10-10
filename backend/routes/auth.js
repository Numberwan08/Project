const express = require('express');
const { register, login, adminRegister, adminLogin, checktoken, get_user, edit_user, delete_user } = require('../controller/auth');
const authtoken = require('../middleware/checktoken');
const uploadTo = require('../middleware/upload');

const router = express.Router();
const uploadToProfile = uploadTo('profile_image');

router.post('/register', uploadToProfile.single('image_profile'), register);
router.post("/login",login);
router.post("/admin",adminRegister)
router.post("/admin/login",adminLogin);
router.post("/checktoken",authtoken,checktoken);
router.get("/profile/:id",get_user);
router.patch("/editprofile/:id", uploadToProfile.single('image_profile'), edit_user);
router.delete("/deleteuser/:id", delete_user);

module.exports = router;
