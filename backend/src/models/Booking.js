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

	static async getCurrentBookingForStatistics(from, to) {
		try {
			const [rows] = await db.query(`
				SELECT 
				COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS booking_count,
				COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed,
				COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
				COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled
			FROM bookings
			WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
				AND payment_status = 'paid' AND status != 'cancelled'
		`, [from, to]);
			return rows[0];
		} catch (error) {
			throw error;
		}
	}

	static async getPreviousBookingForStatistics(from, to) {
		try {
			// Tính toán kỳ trước dựa trên kỳ hiện tại
			const daysDiff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
			const prevToDate = new Date(from); prevToDate.setDate(prevToDate.getDate() - 1);
			const prevFromDate = new Date(prevToDate); prevFromDate.setDate(prevFromDate.getDate() - daysDiff + 1);

			const prevFrom = prevFromDate.toISOString().split("T")[0];
			const prevTo = prevToDate.toISOString().split("T")[0];

			const [rows] = await db.query(`
				SELECT COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS booking_count
				FROM bookings
				WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) 
					AND payment_status = 'paid' AND status != 'cancelled'
			`, [prevFrom, prevTo]);
			return rows[0];
		} catch (error) {
			throw error;
		}
	}
}

module.exports = Booking;
