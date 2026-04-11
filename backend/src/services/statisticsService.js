const db = require("../config/database");
const User = require("../models/User");
const Booking = require("../models/Booking");
const departure = require("../models/Departure");
const Tour = require("../models/Tour");


class StatisticsService {
	static async getRealTimeStats() {
		const usersToday = await User.countNewUsersToday();
		const pendingBookings = await Booking.countPendingBookingsToday();
		const openDepartures = await departure.countOpenDepartures();
		const totalTours = await Tour.totalTours();
		const totalUsers = await User.totalUsers();

		return {
			new_users_today: usersToday,
			pending_bookings: pendingBookings,
			open_departures: openDepartures,
			total_users: totalUsers,
			total_tours: totalTours,
		};
	}

	static async getTourOccupancy() {
		const [rows] = await db.query(`
			SELECT
				t.name AS tour_name, td.departure_date, td.departure_location,
				td.seats_total, td.seats_available, (td.seats_total - td.seats_available) AS seats_booked,
				ROUND(((td.seats_total - td.seats_available) / td.seats_total) * 100, 1) AS occupancy_rate,
				td.status
			FROM tour_departures td
			JOIN tours t ON t.id = td.tour_id
			WHERE td.departure_date >= CURDATE()
			ORDER BY td.departure_date ASC LIMIT 20
		`);
		return rows;
	}

	static async getTimeBasedReport(from, to) {
		const [current] = await db.query(`
			SELECT
				COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS booking_count,
				COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed,
				COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
				COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled
			FROM bookings
			WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
				AND payment_status = 'paid'
		`, [from, to]);

		// So sánh kỳ trước
		const daysDiff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
		const prevTo = new Date(from); prevTo.setDate(prevTo.getDate() - 1);
		const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - daysDiff + 1);

		const [previous] = await db.query(`
			SELECT COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS booking_count
			FROM bookings
			WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) AND payment_status = 'paid'
		`, [prevFrom.toISOString().split("T")[0], prevTo.toISOString().split("T")[0]]);

		const cur = current[0];
		const prev = previous[0];

		const revGrowth = prev.revenue > 0 ? (((cur.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : (cur.revenue > 0 ? 100 : 0);
		const bookGrowth = prev.booking_count > 0 ? (((cur.booking_count - prev.booking_count) / prev.booking_count) * 100).toFixed(1) : (cur.booking_count > 0 ? 100 : 0);

		return {
			period: { from, to },
			revenue: parseFloat(cur.revenue),
			booking_count: cur.booking_count,
			confirmed: cur.confirmed, pending: cur.pending, cancelled: cur.cancelled,
			previous: { revenue: parseFloat(prev.revenue), booking_count: prev.booking_count },
			growth: { revenue: parseFloat(revGrowth), booking: parseFloat(bookGrowth) },
		};
	}

	static async getRevenueChartData(from, to) {
		const daysDiff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
		let sqlExpr, labels = [];

		if (daysDiff <= 1) {
			sqlExpr = "CONCAT(HOUR(created_at), 'h')";
			labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
		} else if (daysDiff <= 31) {
			sqlExpr = "DATE_FORMAT(created_at, '%d/%m')";
			let curr = new Date(from);
			while (curr <= new Date(to)) {
				labels.push(`${String(curr.getDate()).padStart(2, '0')}/${String(curr.getMonth() + 1).padStart(2, '0')}`);
				curr.setDate(curr.getDate() + 1);
			}
		} else {
			sqlExpr = "CONCAT('Th', MONTH(created_at))";
			labels = Array.from({ length: 12 }, (_, i) => `Th${i + 1}`);
		}

		const [rows] = await db.query(`
			SELECT ${sqlExpr} AS label, COALESCE(SUM(total_price), 0) AS revenue
			FROM bookings
			WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
				AND payment_status = 'paid' AND status != 'cancelled'
			GROUP BY ${sqlExpr}
			ORDER BY MIN(created_at)
		`, [from, to]);

		const dataMap = {};
		rows.forEach(r => dataMap[r.label] = parseFloat(r.revenue));
		return { labels, data: labels.map(l => dataMap[l] || 0) };
	}

	static async getBookingStatusByPeriod(from, to) {
		const [rows] = await db.query(`
			SELECT status, COUNT(*) AS count, COALESCE(SUM(total_price), 0) AS total_revenue
			FROM bookings
			WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) AND payment_status = 'paid'
			GROUP BY status
		`, [from, to]);
		return rows;
	}


	static async getTopTours(limit = 10) {
		const [rows] = await db.query(`
			SELECT t.id, t.name, t.region, t.cover_image, COUNT(b.id) AS total_bookings,
				COALESCE(SUM(b.total_price), 0) AS total_revenue, COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(DISTINCT r.id) AS review_count
			FROM tours t
			LEFT JOIN tour_departures td ON td.tour_id = t.id
			LEFT JOIN bookings b ON b.departure_id = td.id AND b.payment_status = 'paid' AND b.status != 'cancelled'
			LEFT JOIN reviews r ON r.tour_id = t.id
			GROUP BY t.id, t.name, t.region, t.cover_image
			ORDER BY total_bookings DESC, total_revenue DESC LIMIT ?
		`, [limit]);
		return rows.map(r => ({ ...r, avg_rating: parseFloat(r.avg_rating).toFixed(1), total_revenue: parseFloat(r.total_revenue) }));
	}

	static async getReviewStats() {
		const [overall] = await db.query(`
			SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total_reviews,
				COUNT(CASE WHEN rating = 5 THEN 1 END) AS star5, COUNT(CASE WHEN rating = 4 THEN 1 END) AS star4,
				COUNT(CASE WHEN rating = 3 THEN 1 END) AS star3, COUNT(CASE WHEN rating = 2 THEN 1 END) AS star2,
				COUNT(CASE WHEN rating = 1 THEN 1 END) AS star1
			FROM reviews
		`);

		const [topRated] = await db.query(`
			SELECT t.id, t.name, t.region, t.cover_image, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
			FROM tours t JOIN reviews r ON r.tour_id = t.id
			GROUP BY t.id, t.name, t.region, t.cover_image HAVING review_count >= 1
			ORDER BY avg_rating DESC, review_count DESC LIMIT 5
		`);

		return { overall: overall[0], top_rated_tours: topRated };
	}

	static async getUserStats() {
		const [toppassengers] = await db.query(`
			SELECT u.id, u.fullname, u.email, COUNT(b.id) AS booking_count, COALESCE(SUM(b.total_price), 0) AS total_spent
			FROM users u JOIN bookings b ON b.user_id = u.id
			WHERE b.payment_status = 'paid' AND b.status != 'cancelled'
			GROUP BY u.id, u.fullname, u.email ORDER BY total_spent DESC LIMIT 5
		`);
		return { top_passengers: toppassengers.map(c => ({ ...c, total_spent: parseFloat(c.total_spent) })) };
	}
}

module.exports = StatisticsService;
