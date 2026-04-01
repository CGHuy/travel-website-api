const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const { verifyToken } = require("../middlewares/auth");

const { validateUpdateProfile } = require("../middlewares/validation/user");

// Lấy thông tin user hiện tại - Cần đăng nhập
router.get("/profile", verifyToken, userController.getProfile);
// Cập nhật thông tin user hiện tại - Cần đăng nhập
router.put(
	"/profile",
	verifyToken,
	validateUpdateProfile,
	userController.updateProfile,
);

module.exports = router;
