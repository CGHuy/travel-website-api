const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { verifyToken, isOwner } = require("../middlewares/auth");

// Lấy danh sách tour yêu thích của người dùng (chỉ owner )
router.get("/:id", verifyToken, isOwner("id"), wishlistController.getWishlist);

// Thêm tour vào wishlist
router.post(
	"/:id",
	verifyToken,
	isOwner("id"),
	wishlistController.addToWishlist,
);

// Xóa tour khỏi wishlist (chỉ owner )
router.delete(
	"/:id/:tourId",
	verifyToken,
	isOwner("id"),
	wishlistController.removeFromWishlist,
);

module.exports = router;
