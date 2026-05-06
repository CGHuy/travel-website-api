const db = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
	
	// Tạo user mới
	static async create(userData) {
		try {
			const { fullname, phone, email, password, role = "customer" } = userData;

			// Hash password
			const hashedPassword = await bcrypt.hash(password, 10);

			const [result] = await db.query(
				`INSERT INTO users (fullname, phone, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
				[fullname, phone, email, hashedPassword, role],
			);

			return result.insertId;
		} catch (error) {
			throw error;
		}
	}

	// Xác thực password
	static async comparePassword(plainPassword, hashedPassword) {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}

	// Tìm user theo email
	static async findByEmail(email) {
		try {
			const [rows] = await db.query(
				`SELECT * FROM users WHERE email = ? LIMIT 1`,
				[email],
			);
			return rows[0] || null;
		} catch (error) {
			throw error;
		}
	}

	// Tìm user theo số điện thoại
	static async findByPhone(phone) {
		try {
			const [rows] = await db.query(
				`SELECT * FROM users WHERE phone = ? LIMIT 1`,
				[phone],
			);
			return rows[0] || null;
		} catch (error) {
			throw error;
		}
	}

	// Tìm user theo email hoặc phone
	static async findByEmailOrPhone(username) {
		try {
			const [rows] = await db.query(
				`SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
				[username, username],
			);
			return rows[0] || null;
		} catch (error) {
			throw error;
		}
	}

	// Tìm user theo id
	static async findById(id) {
		try {
			const [rows] = await db.query(
				`SELECT * FROM users WHERE id = ? LIMIT 1`,
				[id],
			);
			return rows[0] || null;
		} catch (error) {
			throw error;
		}
	}

	// Lấy tất cả users (cho admin)
	static async getAll() {
		try {
			const [rows] = await db.query(`
                SELECT id, fullname, phone, email, role,status, created_at FROM users ORDER BY id DESC`);
			return rows;
		} catch (error) {
			throw error;
		}
	}

	// Lấy danh sách users có phân trang (cho admin)
	static async getAllPaginated(page = 1, limit = 10) {
		try {
			const offset = (page - 1) * limit;
			const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users`);
			const [rows] = await db.query(
				`SELECT id, fullname, phone, email, role, status, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?`,
				[limit, offset]
			);
			return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
		} catch (error) {
			throw error;
		}
	}

	// Tìm kiếm users có phân trang (cho admin)
	static async searchUsersPaginated(filters = {}, page = 1, limit = 10) {
		try {
			const offset = (page - 1) * limit;
			let baseQuery = `FROM users WHERE 1=1`;
			const params = [];

			if (filters.id) { baseQuery += ` AND id = ?`; params.push(filters.id); }
			if (filters.phone) { baseQuery += ` AND phone LIKE ?`; params.push(`%${filters.phone}%`); }
			if (filters.role) { baseQuery += ` AND role = ?`; params.push(filters.role); }
			if (filters.status !== undefined) { baseQuery += ` AND status = ?`; params.push(filters.status); }
			if (filters.fullname) { baseQuery += ` AND fullname LIKE ?`; params.push(`%${filters.fullname}%`); }
			if (filters.email) { baseQuery += ` AND email LIKE ?`; params.push(`%${filters.email}%`); }

			const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
			const [rows] = await db.query(
				`SELECT id, fullname, phone, email, role, status, created_at ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`,
				[...params, limit, offset]
			);
			return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
		} catch (error) {
			throw error;
		}
	}

	// Cập nhật thông tin user danh cho admin
	static async updateUser(id, userData) {
		try {
			const {id, fullname, phone, email, role, status } = userData;
			const [result] = await db.query(
				`UPDATE users SET fullname = ?, phone = ?, email = ?, role = ?, status = ? WHERE id = ?`,
				[fullname, phone, email, role, status, id],
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}

	// Xóa user
	static async delete(id) {
		try {
			const [result] = await db.query(
				`DELETE FROM users WHERE id = ?`,
				[id],
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}
	// Cập nhật trạng thái user (active/inactive)
	static async updateStatus(id, status) {
		try {
			const [result] = await db.query(
				`UPDATE users SET status = ? WHERE id = ?`,
				[status, id],
			);
			return result.affectedRows > 0;
		}
		catch (error) {
			throw error;
		}
	}

	// Cập nhật tài khoản người dùng - Che
	static async updateProfile(id, profileData) {
		try {
			const { fullname, phone, email } = profileData;
			const [result] = await db.query(
				`UPDATE users SET fullname = ?, phone = ?, email = ? WHERE id = ?`,
				[fullname, phone, email, id],
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}

	// Lấy thông tin user hiện tại - Che
	static async getProfile(id) {
		try {
			const [rows] = await db.query(
				`SELECT id, fullname, phone, email, role, created_at FROM users WHERE id = ?`,
				[id],
			);
			return rows[0];
		} catch (error) {
			throw error;
		}
	}

	// Đổi mật khẩu - Che
	static async changePassword(id, newPassword) {
		try {
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			const [result] = await db.query(
				`
				UPDATE users SET password = ? WHERE id = ?`,
				[hashedPassword, id],
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}
	// Tìm kiếm users với nhiều tiêu chí
	static async searchUsers(filters = {}) {
		try {
			let query = `SELECT id, fullname, phone, email, role, status, created_at FROM users WHERE 1=1`;
			const params = [];

			if (filters.id) {
				query += ` AND id = ?`;
				params.push(filters.id);
			}
			if (filters.phone) {
				query += ` AND phone LIKE ?`;
				params.push(`%${filters.phone}%`);
			}
			if (filters.role) {
				query += ` AND role = ?`;
				params.push(filters.role);
			}
			if (filters.status !== undefined) {
				query += ` AND status = ?`;
				params.push(filters.status);
			}
			if (filters.fullname) {
				query += ` AND fullname LIKE ?`;
				params.push(`%${filters.fullname}%`);
			}
			if (filters.email) {
				query += ` AND email LIKE ?`;
				params.push(`%${filters.email}%`);
			}

			query += ` ORDER BY id DESC`;

			const [rows] = await db.query(query, params);
			return rows;
		} catch (error) {
			throw error;
		}
	}

	// === Thống kê==
	//Lấy user tạo mới cho ngày hiện tại 
	static async countNewUsersToday() {
		try {
			const [rows] = await db.query(
				`SELECT COUNT(*) AS count FROM users 
				WHERE role = 'customer' AND status = 1 AND created_at >= NOW() - INTERVAL 24 HOUR`
			);
			return rows[0].count;
		} catch (error) {
			throw error;
		}
	}

	static async totalUsers() {
		try {
			const [rows] = await db.query(`SELECT COUNT(*) AS total_users FROM users WHERE role = 'customer' AND status = 1`);
			return rows[0].total_users;
		} catch (error) {
			throw error;
		}
	}
}

module.exports = User;
