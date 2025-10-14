const express = require('express');
const { register, login, adminRegister, adminLogin, checktoken, get_user, edit_user, delete_user, update_user_status } = require('../controller/auth');
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
// Deprecated: was hard delete, now repurposed to suspend by setting status=0
router.delete("/deleteuser/:id", delete_user);
// Update or toggle user status
router.patch("/user/status/:id", update_user_status);

module.exports = router;
