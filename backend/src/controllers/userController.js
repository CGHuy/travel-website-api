const User = require("../models/User");
const db = require("../config/database");

// Cập nhật thông tin user hiện tại
exports.updateProfile = async (req, res) => {
	try {
		const userId = req.user.id;
		const { fullname, phone, email } = req.body;

		// Kiểm tra email đã tồn tại cho user khác chưa
		const [emailRows] = await db.query(
			"SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
			[email, userId],
		);
		if (emailRows.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Email đã được sử dụng bởi người dùng khác!",
			});
		}

		// Cập nhật thông tin
		await db.query(
			"UPDATE users SET fullname = ?, phone = ?, email = ? WHERE id = ?",
			[fullname, phone, email, userId],
		);

		return res.json({
			success: true,
			message: "Cập nhật thông tin thành công!",
			data: { fullname, phone, email },
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi cập nhật thông tin user",
			error: error.message,
		});
	}
};

// Lấy thông tin user hiện tại
exports.getProfile = async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.getProfile(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy thông tin user",
			});
		}
		return res.json({
			success: true,
			message: "Lấy thông tin user thành công!",
			data: user,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi lấy thông tin user",
			error: error.message,
		});
	}
};
