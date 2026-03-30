const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const { verifyToken, isUser } = require("../middlewares/auth");

// Lấy thông tin user hiện tại - Cần đăng nhập
router.get("/profile", verifyToken, userController.getProfile);
