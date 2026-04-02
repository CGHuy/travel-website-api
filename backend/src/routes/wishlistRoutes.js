const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { verifyToken, isOwner } = require("../middlewares/auth");

// Lấy danh sách tour yêu thích của người dùng (chỉ owner hoặc admin)
router.get("/:id", verifyToken, isOwner("id"), wishlistController.getWishlist);
module.exports = router;
