const db = require("../config/database");

class Booking {
	// 1. Lấy tất cả bookings (Dành cho Admin) - Che
	static async getAll() {
		try {
			const [rows] = await db.query(`
                SELECT * FROM bookings ORDER BY created_at DESC
            `);
			return rows;
		} catch (error) {
			throw error;
		}
	}

	// 1.5 Lấy booking theo ID (Dành cho xem chi tiết, Danh cho Admin)
	static async getById(id) {
		// Che
		try {
			const [rows] = await db.query(
				`
				SELECT * FROM bookings WHERE id = ? LIMIT 1`,
				[id],
			);
			return rows[0] || null;
		} catch (error) {
			throw error;
		}
	}

	// 2. Lấy bookings theo user ID (Dành cho khách hàng xem lịch sử) - Che
	static async getByUserId(userId) {
		try {
			const [rows] = await db.query(
				`
               SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC
            `,
				[userId],
			);
			return rows;
		} catch (error) {
			throw error;
		}
	}

	// Người dùng gửi yêu cầu hủy booking (chuyển trạng thái sang "pending")
	static async requestCancellation(id) {
		try {
			const [rows] = await db.query(
				`SELECT status FROM bookings WHERE id = ? LIMIT 1`,
				[id],
			);
			const row = rows[0];
			if (!row) return false;
			// Chỉ cho phép chuyển sang 'pending' khi trạng thái hiện tại là 'confirmed'
			if (row.status !== "confirmed") return false;

			const [result] = await db.query(
				`UPDATE bookings SET status = 'pending', updated_at = NOW() WHERE id = ?`,
				[id],
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}

	// Cập nhật trường bất kỳ (ví dụ: status, payment_status)
	static async updateStatus(id, field, value) {
		try {
			const allowedFields = ["status", "payment_status"];
			if (!allowedFields.includes(field)) {
				throw new Error("Invalid field to update");
			}

			const [result] = await db.query(
				`UPDATE bookings SET ?? = ?, updated_at = NOW() WHERE id = ?`,
				[field, value, id],
			);
			return result.affectedRows > 0;
		} catch (error) {
			throw error;
		}
	}

	// === Thống kê ===
	static async countPendingBookingsToday() {
		try
		{
			const [rows] = await db.query(`SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'`);
			return rows[0].count || 0;
		}
		catch (error) {
			throw error;
		}
	}

	static async getAvailableYears() {
		const [rows] = await db.query(`
			SELECT DISTINCT YEAR(created_at) AS year 
			FROM bookings 
			ORDER BY year DESC
		`);
		return rows.map(r => r.year);
	}

}

module.exports = Booking;
