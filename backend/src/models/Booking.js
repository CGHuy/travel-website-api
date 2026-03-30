const db = require("../config/database");

class Booking {
	// 1. Lấy tất cả bookings (Dành cho Admin) - Che
	static async getAll() {
		try {
			const [rows] = await db.query(`
                SELECT 
                    b.*, 
                    u.fullname, 
                    u.email as user_email, 
                    t.name as tour_name, 
                    t.price_default,
                    td.departure_date
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                ORDER BY b.created_at DESC
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
				SELECT b.*, 
                    u.fullname, 
                    u.email as user_email, 
					u.phone as user_phone,
					t.id as tour_id,
                    t.name as tour_name, 
                    t.price_default,
                    td.departure_date,
                    td.departure_location
				FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.id = ?
				LIMIT 1`,
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
                SELECT 
                    b.*, 
                    t.name as tour_name, 
                    t.cover_image,
                    td.departure_date,
                    td.departure_location
                FROM bookings b
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
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
}

module.exports = Booking;
