const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const { verifyToken } = require("../middlewares/auth");

const {
	validateUpdateProfile,
	validateChangePassword,
} = require("../middlewares/validation/user");

// Lấy thông tin user hiện tại - Cần đăng nhập
router.get("/profile", verifyToken, userController.getProfile);
// Cập nhật thông tin user hiện tại - Cần đăng nhập
router.put(
	"/profile",
	verifyToken,
	validateUpdateProfile,
	userController.updateProfile,
);

// Đổi mật khẩu
router.put(
	"/change-password",
	verifyToken,
	validateChangePassword,
	userController.changePassword,
);

module.exports = router;
