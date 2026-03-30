const User = require("../models/User");
const db = require("../config/database");

class UserController {
	// Lấy thông tin user hiện tại - Che
	static async getProfile(req, res) {
		try {
			const user = await User.findById(req.user.id);
			if (!user) {
				return res.status(404).json({ message: "Không tìm thấy user" });
			}
			res.json(user);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}
}
