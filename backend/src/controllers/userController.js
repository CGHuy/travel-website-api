const User = require("../models/User");
const db = require("../config/database");
const jwt = require("jsonwebtoken");

// Cập nhật thông tin user hiện tại - Che
exports.updateProfile = async (req, res) => {
	try {
		const userId = req.user.id;
		const { fullname, phone, email } = req.body;

		// Kiểm tra email đã tồn tại cho user khác chưa
		const existingUser = await User.findByEmail(email);
		if (existingUser && existingUser.id !== userId) {
			return res.status(400).json({
				success: false,
				message: "Email đã được sử dụng bởi người dùng khác!",
			});
		}

		// Cập nhật thông tin sử dụng Model User
		const success = await User.updateProfile(userId, { fullname, phone, email });

		if (!success) {
			return res.status(400).json({
				success: false,
				message: "Cập nhật thông tin thất bại!",
			});
		}

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

// Lấy thông tin user hiện tại - Che
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

// Đổi thông tin mật khẩu - Che
exports.changePassword = async (req, res) => {
	try {
		const userId = req.user.id;

		// Các kiểm tra đầu vào (presence/confirm) được xử lý bởi middleware `validateChangePassword`.
		const { currentPassword, newPassword } = req.body;

		const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [
			userId,
		]);
		const userRow = rows[0];
		if (!userRow) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy người dùng.",
			});
		}

		const isMatch = await User.comparePassword(
			currentPassword,
			userRow.password,
		);
		if (!isMatch) {
			return res.status(400).json({
				success: false,
				message: "Mật khẩu hiện tại không đúng.",
			});
		}

		const updated = await User.changePassword(userId, newPassword);
		if (!updated) {
			return res.status(500).json({
				success: false,
				message: "Cập nhật mật khẩu thất bại.",
			});
		}

		// Lấy lại thông tin user để ký token mới đầy đủ (id, email, role)
		const user = await User.findById(userId);
		const secret = process.env.JWT_SECRET || "change_pwd_secret";
		const token = jwt.sign(
			{ 
				id: user.id, 
				email: user.email, 
				role: user.role 
			}, 
			secret, 
			{ expiresIn: "7d" }
		);

		return res.json({
			success: true,
			message: "Đổi mật khẩu thành công!",
			data: { token },
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi đổi mật khẩu",
			error: error.message,
		});
	}
};

// Tạo tài khoản nhân viên (dành cho admin)
exports.createStaff = async (req, res) => {
	try {
		const { fullname, phone, email, password, role } = req.body;

		// Chỉ cho phép tạo các role nhân viên/admin
		const allowedRoles = ['booking-staff', 'tour-staff', 'admin'];
		if (!allowedRoles.includes(role)) {
			return res.status(400).json({
				success: false,
				message: "Vai trò không hợp lệ. Chỉ chấp nhận: booking-staff, tour-staff, admin",
			});
		}

		// Validate bắt buộc
		if (!fullname || !email || !password) {
			return res.status(400).json({
				success: false,
				message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu",
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				success: false,
				message: "Mật khẩu phải có ít nhất 6 ký tự",
			});
		}

		// Kiểm tra email trùng
		const existingEmail = await User.findByEmail(email);
		if (existingEmail) {
			return res.status(409).json({
				success: false,
				message: "Email này đã được sử dụng bởi tài khoản khác!",
			});
		}

		// Kiểm tra phone trùng (nếu có nhập)
		if (phone) {
			const existingPhone = await User.findByPhone(phone);
			if (existingPhone) {
				return res.status(409).json({
					success: false,
					message: "Số điện thoại này đã được sử dụng bởi tài khoản khác!",
				});
			}
		}

		// Tạo tài khoản (User.create() đã tự hash password)
		const userId = await User.create({ fullname, phone, email, password, role });

		// Cập nhật status = 1 (active) ngay sau khi tạo
		await User.updateStatus(userId, 1);

		return res.status(201).json({
			success: true,
			message: `Tạo tài khoản ${role} thành công!`,
			data: { id: userId, fullname, email, phone, role },
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi tạo tài khoản nhân viên",
			error: error.message,
		});
	}
};

// Lay danh sach tat ca user có phân trang (dành cho admin)
exports.getAllUsers = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;

		const result = await User.getAllPaginated(page, limit);
		return res.json({
			success: true,
			message: "Lấy danh sách users thành công!",
			data: result.data,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi lấy danh sách users",
			error: error.message,
		});
	}
};

// Tìm kiếm users với nhiều tiêu chí có phân trang (dành cho admin)
exports.searchUsers = async (req, res) => {
	try {
		const { id, phone, role, status, fullname, email } = req.query;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const filters = {};

		if (id) filters.id = id;
		if (phone) filters.phone = phone;
		if (role) filters.role = role;
		if (status !== undefined && status !== "") filters.status = parseInt(status);
		if (fullname) filters.fullname = fullname;
		if (email) filters.email = email;
		
		const result = await User.searchUsersPaginated(filters, page, limit);
		return res.json({
			success: true,
			message: "Tìm kiếm users thành công!",
			data: result.data,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi tìm kiếm users",
			error: error.message,
		});
	}
};

// Xóa user (dành cho admin)
exports.deleteUser = async (req, res) => {
	try {
		const userId = req.params.id;

		// Lấy thông tin user để kiểm tra role
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy user để xóa",
			});
		}

		// Kiểm tra role admin : status = 1 không được phép xóa
		if (user.role === "admin"|| user.role === "tour-staff" || user.role === "booking-staff" || user.status === 1) {
			return res.status(403).json({
				success: false,
				message: "Không được phép xóa user có vai trò admin hoặc có trạng thái đang hoạt động",
			});
		}

		const success = await User.delete(userId);
		if (!success) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy user để xóa",
			});
		}
		return res.json({
			success: true,
			message: "Xóa user thành công!",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,	
			message: "Lỗi khi xóa user",
			error: error.message,
		});
	}	
};

// Cập nhật thông tin user (dành cho admin)
exports.updateUser = async (req, res) => {
	try {
		const userId = req.params.id;
		const { fullname, phone, email, role, status } = req.body;

		// Lấy thông tin user hiện tại để kiểm tra
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy user để cập nhật",
			});
		}

		// [Fix #1] Kiểm tra email đã tồn tại cho user khác chưa
		if (email && email !== currentUser.email) {
			const existingUser = await User.findByEmail(email);
			if (existingUser && existingUser.id !== parseInt(userId)) {
				return res.status(400).json({
					success: false,
					message: "Email này đã được sử dụng bởi người dùng khác!",
				});
			}
		}

		// Kiểm tra xem role có bị thay đổi không
		if (role && role !== currentUser.role) {
			return res.status(400).json({
				success: false,
				message: "Không được phép thay đổi vai trò của user",
			});
		}

		const userData = { id: userId, fullname, phone, email, role: currentUser.role, status };
		const success = await User.updateUser(userId, userData);
		if (!success) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy user để cập nhật",
			});
		}
		return res.json({
			success: true,
			message: "Cập nhật user thành công!",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi cập nhật user",
			error: error.message,
		});
	}
};

// Cập nhật trạng thái user (dành cho admin)
exports.updateStatus = async (req, res) => {
	try {
		const userId = req.params.id;
		const { status } = req.body;	

		// Lấy thông tin user hiện tại để kiểm tra role
		const currentUser = await User.findById(userId);
		if (!currentUser) {		
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy user để cập nhật trạng thái",
			});
		}			
		// Kiểm tra xem user có phải là admin không
		if (currentUser.role === "admin") {
			return res.status(400).json({
				success: false,
				message: "Không được phép thay đổi trạng thái của user có vai trò admin",
			});
		}
		const success = await User.updateStatus(userId, status);
		if (!success) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy user để cập nhật trạng thái",
			});
		}
		return res.json({
			success: true,
			message: "Cập nhật trạng thái user thành công!",
		});
	} 
	catch (error) {
		return res.status(500).json({
			success: false,	
			message: "Lỗi khi cập nhật trạng thái user",
			error: error.message,
		});
	}
};
