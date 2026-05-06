const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const { verifyToken, isAdmin} = require("../middlewares/auth");

const {
	validateUpdateProfile,
	validateChangePassword,
	validateCreateStaff,
	validateUpdateUser,
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

// Tìm kiếm users với nhiều tiêu chí - Cần đăng nhập và có role admin
router.get("/search", verifyToken, isAdmin, userController.searchUsers);
// Lấy danh sách tất cả user - Cần đăng nhập và có role admin
router.get("/all", verifyToken, isAdmin, userController.getAllUsers);

// Tạo tài khoản nhân viên - Cần đăng nhập và có role admin
router.post("/staff", verifyToken, isAdmin, validateCreateStaff, userController.createStaff);


// Xóa user - Cần đăng nhập và có role admin
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);

// Cập nhật user - Cần đăng nhập và có role admin
router.put("/:id", verifyToken, isAdmin, validateUpdateUser, userController.updateUser);
// Cập nhật trạng thái user (active/inactive) - Cần đăng nhập và có role admin
router.put("/:id/status", verifyToken, isAdmin, userController.updateStatus);
module.exports = router;
