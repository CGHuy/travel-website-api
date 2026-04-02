const db = require("../config/database");
const Wishlist = require("../models/Wishlist");

// Lấy danh sách tour yêu thích của người dùng
exports.getWishlist = async (req, res) => {
	try {
		const userIdParam = req.params.id;
		const userId = parseInt(userIdParam, 10);
		if (isNaN(userId)) {
			return res.status(400).json({
				success: false,
				message: "User id không hợp lệ",
			});
		}

		const wishlistItems = await Wishlist.getByUserId(userId);
		res.json({
			success: true,
			count: wishlistItems.length,
			data: wishlistItems,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi lấy danh sách yêu thích",
			error: error.message,
		});
	}
};
