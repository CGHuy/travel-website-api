const db = require("../config/database");

class bookingService {
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
}

module.exports = bookingService;
