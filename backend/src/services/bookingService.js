const db = require("../config/database");

class bookingService {
	//================== USER ===================

	// Lấy danh sách booking đã đặt của người dùng
	static async getBookingsByUserId(userId) {
		try {
			const [rows] = await db.query(
				`SELECT 
                    b.id,
                    t.name as tour_name,
                    td.departure_date,
                    b.total_price,
                    b.status as booking_status,
                    b.created_at
                FROM bookings b
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC`,
				[userId],
			);
			return rows;
		} catch (error) {
			throw error;
		}
	}

	// Xem chi tiết booking mà người dùng đã đặt
	static async getBookingDetailsByUserId(bookingId, userId) {
		try {
			// Lấy chi tiết booking kèm theo thông tin tour, lịch trình
			const [rows] = await db.query(
				`SELECT 
                    b.*,
                    t.name as tour_name,
                    td.departure_date,
                    td.departure_location,
                    (
                        SELECT GROUP_CONCAT(s.name SEPARATOR ', ')
                        FROM tour_services ts
                        JOIN services s ON ts.service_id = s.id
                        WHERE ts.tour_id = t.id
                    ) as service_names
                FROM bookings b
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.id = ? AND b.user_id = ?
                LIMIT 1`,
				[bookingId, userId],
			);
			return rows[0] || null;
		} catch (error) {
			throw error;
		}
	}

	//================== ADMIN ===================

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
                    td.departure_location,
					c.fullname as customer_name,
					c.dob as customer_dob,
					c.gender as customer_gender,
					c.passenger_type as customer_passenger_type
				FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
				LEFT JOIN customers c ON b.id = c.booking_id
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

	// Tìm kiếm booking theo mã booking , user id và lọc trạng thái

	static async searchBooking(userId, tourId, status) {
		try {
			let query = `
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
                WHERE 1=1
			`;
			const params = [];

			if (userId) {
				query += " AND b.user_id = ?";
				params.push(userId);
			}

			if (tourId) {
				query += " AND t.id = ?";
				params.push(tourId);
			}

			if (status) {
				query += " AND b.status = ?";
				params.push(status);
			}

			query += " ORDER BY b.created_at DESC";

			const [rows] = await db.query(query, params);
			return rows;
		} catch (error) {
			throw error;
		}
	}
}

module.exports = bookingService;
