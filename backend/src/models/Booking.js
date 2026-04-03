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

	// 3. Tạo booking mới (Khớp với các cột trong db.sql)
	static async create(data) {
		try {
			const {
				user_id,
				departure_id,
				adults,
				children,
				total_price,
				contact_name,
				contact_phone,
				contact_email,
				note,
			} = data;

			const [result] = await db.query(
				`
                INSERT INTO bookings (
                    user_id, departure_id, adults, children, 
                    total_price, contact_name, contact_phone, 
                    contact_email, note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					user_id,
					departure_id,
					adults,
					children,
					total_price,
					contact_name,
					contact_phone,
					contact_email,
					note,
				],
			);

			return result.insertId;
		} catch (error) {
			throw error;
		}
	}

	// 4. Cập nhật trạng thái (paid, refunded, cancelled) - Che
	static async updateStatus(id, statusField, statusValue) {
		try {
			const [result] = await db.query(
				`
                UPDATE bookings 
                SET ${statusField} = ?, updated_at = NOW() 
                WHERE id = ?`,
				[statusValue, id],
			);
			return result.affectedRows > 0;
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
}

module.exports = Booking;
