const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { verifyToken, isUser } = require("../middlewares/auth");



// Lấy danh sách đánh giá của user hiện tại
router.get("/", verifyToken, isUser, reviewController.getUserReviews);

// Tạo đánh giá mới
router.post("/create", verifyToken, isUser, reviewController.createReview);

// Cập nhật đánh giá
router.put("/:id", verifyToken, isUser, reviewController.updateReview);

// Xóa đánh giá
router.delete("/:id", verifyToken, isUser, reviewController.deleteReview);

module.exports = router;
