const db = require("../config/database");

class StatisticsService {
	// =================== OVERVIEW (KPI CARDS) ===================

	static async getOverview() {
		const [revenue] = await db.query(`
			SELECT
				COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total_price END), 0) AS revenue_this_month,
				COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(NOW() - INTERVAL 1 MONTH) THEN total_price END), 0) AS revenue_last_month,
				COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END) AS bookings_this_month,
				COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(NOW() - INTERVAL 1 MONTH) THEN 1 END) AS bookings_last_month,
				COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_bookings,
				COUNT(*) AS total_bookings
			FROM bookings
			WHERE payment_status = 'paid'
		`);

		const [users] = await db.query(`
			SELECT
				COUNT(*) AS total_users,
				COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END) AS new_users_this_month
			FROM users
			WHERE role = 'customer' AND status = 1
		`);

		const [tours] = await db.query(`
			SELECT
				COUNT(*) AS total_tours,
				COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_departures
			FROM tour_departures
		`);

		const stat = revenue[0];
		const revenueGrowth =
			stat.revenue_last_month > 0
				? (((stat.revenue_this_month - stat.revenue_last_month) / stat.revenue_last_month) * 100).toFixed(1)
				: null;

		const bookingGrowth =
			stat.bookings_last_month > 0
				? (((stat.bookings_this_month - stat.bookings_last_month) / stat.bookings_last_month) * 100).toFixed(1)
				: null;

		return {
			revenue_this_month: stat.revenue_this_month,
			revenue_last_month: stat.revenue_last_month,
			revenue_growth: revenueGrowth,
			bookings_this_month: stat.bookings_this_month,
			bookings_last_month: stat.bookings_last_month,
			bookings_growth: bookingGrowth,
			pending_bookings: stat.pending_bookings,
			total_bookings: stat.total_bookings,
			total_users: users[0].total_users,
			new_users_this_month: users[0].new_users_this_month,
			total_tours: tours[0].total_tours,
			open_departures: tours[0].open_departures,
		};
	}

	// =================== DOANH THU THEO THÁNG ===================

	static async getRevenueByMonth(year) {
		const targetYear = year || new Date().getFullYear();
		const [rows] = await db.query(
			`
			SELECT
				MONTH(created_at) AS month,
				COALESCE(SUM(total_price), 0) AS revenue,
				COUNT(*) AS booking_count
			FROM bookings
			WHERE YEAR(created_at) = ?
				AND payment_status = 'paid'
				AND status != 'cancelled'
			GROUP BY MONTH(created_at)
			ORDER BY month
		`,
			[targetYear]
		);

		// Đảm bảo đủ 12 tháng
		const result = Array.from({ length: 12 }, (_, i) => ({
			month: i + 1,
			revenue: 0,
			booking_count: 0,
		}));
		rows.forEach((r) => {
			result[r.month - 1] = { month: r.month, revenue: parseFloat(r.revenue), booking_count: r.booking_count };
		});
		return { year: targetYear, data: result };
	}

	// =================== TOP TOUR BÁN CHẠY ===================

	static async getTopTours(limit = 10) {
		const [rows] = await db.query(
			`
			SELECT
				t.id,
				t.name,
				t.region,
				t.cover_image,
				COUNT(b.id) AS total_bookings,
				COALESCE(SUM(b.total_price), 0) AS total_revenue,
				COALESCE(AVG(r.rating), 0) AS avg_rating,
				COUNT(DISTINCT r.id) AS review_count
			FROM tours t
			LEFT JOIN tour_departures td ON td.tour_id = t.id
			LEFT JOIN bookings b ON b.departure_id = td.id AND b.payment_status = 'paid' AND b.status != 'cancelled'
			LEFT JOIN reviews r ON r.tour_id = t.id
			GROUP BY t.id, t.name, t.region, t.cover_image
			ORDER BY total_bookings DESC, total_revenue DESC
			LIMIT ?
		`,
			[limit]
		);
		return rows.map((r) => ({ ...r, avg_rating: parseFloat(r.avg_rating).toFixed(1), total_revenue: parseFloat(r.total_revenue) }));
	}

	// =================== THỐNG KÊ BOOKING THEO TRẠNG THÁI ===================

	static async getBookingStatusStats() {
		const [rows] = await db.query(`
			SELECT
				status,
				COUNT(*) AS count,
				COALESCE(SUM(total_price), 0) AS total_revenue
			FROM bookings
			WHERE payment_status = 'paid'
			GROUP BY status
		`);
		return rows;
	}

	// =================== THỐNG KÊ NGƯỜI DÙNG ===================

	static async getUserStats() {
		const [byRole] = await db.query(`
			SELECT role, COUNT(*) AS count
			FROM users
			GROUP BY role
		`);

		const [newUsers] = await db.query(`
			SELECT
				DATE_FORMAT(created_at, '%Y-%m') AS month,
				COUNT(*) AS count
			FROM users
			WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
			GROUP BY month
			ORDER BY month
		`);

		const [topCustomers] = await db.query(`
			SELECT
				u.id,
				u.fullname,
				u.email,
				COUNT(b.id) AS booking_count,
				COALESCE(SUM(b.total_price), 0) AS total_spent
			FROM users u
			JOIN bookings b ON b.user_id = u.id
			WHERE b.payment_status = 'paid' AND b.status != 'cancelled'
			GROUP BY u.id, u.fullname, u.email
			ORDER BY total_spent DESC
			LIMIT 5
		`);

		return {
			by_role: byRole,
			new_users_by_month: newUsers,
			top_customers: topCustomers.map((c) => ({ ...c, total_spent: parseFloat(c.total_spent) })),
		};
	}

	// =================== THỐNG KÊ ĐÁNH GIÁ ===================

	static async getReviewStats() {
		const [overall] = await db.query(`
			SELECT
				ROUND(AVG(rating), 1) AS avg_rating,
				COUNT(*) AS total_reviews,
				COUNT(CASE WHEN rating = 5 THEN 1 END) AS star5,
				COUNT(CASE WHEN rating = 4 THEN 1 END) AS star4,
				COUNT(CASE WHEN rating = 3 THEN 1 END) AS star3,
				COUNT(CASE WHEN rating = 2 THEN 1 END) AS star2,
				COUNT(CASE WHEN rating = 1 THEN 1 END) AS star1
			FROM reviews
		`);

		const [topRated] = await db.query(`
			SELECT
				t.id,
				t.name,
				t.region,
				t.cover_image,
				ROUND(AVG(r.rating), 1) AS avg_rating,
				COUNT(r.id) AS review_count
			FROM tours t
			JOIN reviews r ON r.tour_id = t.id
			GROUP BY t.id, t.name, t.region, t.cover_image
			HAVING review_count >= 1
			ORDER BY avg_rating DESC, review_count DESC
			LIMIT 5
		`);

		const [mostWishlisted] = await db.query(`
			SELECT
				t.id,
				t.name,
				t.region,
				t.cover_image,
				COUNT(w.id) AS wishlist_count
			FROM tours t
			JOIN wishlist w ON w.tour_id = t.id
			GROUP BY t.id, t.name, t.region, t.cover_image
			ORDER BY wishlist_count DESC
			LIMIT 5
		`);

		return {
			overall: overall[0],
			top_rated_tours: topRated,
			most_wishlisted: mostWishlisted,
		};
	}

	// =================== THỐNG KÊ TỶ LỆ LẤP ĐẦY ===================

	static async getTourOccupancy() {
		const [rows] = await db.query(`
			SELECT
				t.name AS tour_name,
				td.departure_date,
				td.departure_location,
				td.seats_total,
				td.seats_available,
				td.seats_total - td.seats_available AS seats_booked,
				ROUND(((td.seats_total - td.seats_available) / td.seats_total) * 100, 1) AS occupancy_rate,
				td.status
			FROM tour_departures td
			JOIN tours t ON t.id = td.tour_id
			WHERE td.departure_date >= CURDATE()
			ORDER BY td.departure_date ASC
			LIMIT 20
		`);
		return rows;
	}
}

module.exports = StatisticsService;
