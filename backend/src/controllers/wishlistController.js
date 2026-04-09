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

// Xóa tour khoi wishlist
exports.removeFromWishlist = async (req, res) => {
	try {
		const userIdParam = req.params.id;
		const tourIdParam = req.params.tourId;
		const userId = parseInt(userIdParam, 10);
		const tourId = parseInt(tourIdParam, 10);
		if (isNaN(userId) || isNaN(tourId)) {
			return res.status(400).json({
				success: false,
				message: "User id hoặc tour id không hợp lệ",
			});
		}
		const removed = await Wishlist.remove(userId, tourId);
		if (removed) {
			res.json({ success: true, message: "Đã xóa khỏi yêu thích" });
		} else {
			res.status(404).json({
				success: false,
				message: "Không tìm thấy tour trong yêu thích",
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi xóa khỏi yêu thích",
			error: error.message,
		});
	}
};

// Thêm tour vào wishlist
exports.addToWishlist = async (req, res) => {
	try {
		const userId = parseInt(req.params.id, 10);
		const { tour_id } = req.body;

		if (isNaN(userId) || !tour_id) {
			return res.status(400).json({
				success: false,
				message: "Dữ liệu không hợp lệ",
			});
		}

		// Check duplicate
		const exists = await Wishlist.exists(userId, tour_id);
		if (exists) {
			return res.status(400).json({
				success: false,
				message: "Tour đã có trong danh sách yêu thích",
			});
		}

		const insertId = await Wishlist.add(userId, tour_id);
		res.json({
			success: true,
			message: "Đã thêm vào yêu thích",
			data: { id: insertId, user_id: userId, tour_id }
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi thêm vào yêu thích",
			error: error.message,
		});
	}
};
