const db = require("../config/database");
const User = require("../models/User");
const Booking = require("../models/Booking");
const departure = require("../models/Departure");
const Tour = require("../models/Tour");
const Review = require("../models/Review");


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

	static async getTourOccupancy(page = 1, limit = 10) {
		const offset = (page - 1) * limit;

		// 1. Đếm tổng số bản ghi
		const [[{ total }]] = await db.query(`
			SELECT COUNT(*) AS total FROM tour_departures WHERE departure_date >= CURDATE()
		`);

		// 2. Lấy dữ liệu có phân trang
		const [rows] = await db.query(`
			SELECT
				t.name AS tour_name, td.departure_date, td.departure_location,
				td.seats_total, td.seats_available, (td.seats_total - td.seats_available) AS seats_booked,
				ROUND(((td.seats_total - td.seats_available) / td.seats_total) * 100, 1) AS occupancy_rate,
				td.status
			FROM tour_departures td
			JOIN tours t ON t.id = td.tour_id
			WHERE td.departure_date >= CURDATE()
			ORDER BY td.departure_date ASC 
			LIMIT ? OFFSET ?
		`, [parseInt(limit), parseInt(offset)]);

		return {
			data: rows,
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				total_pages: Math.ceil(total / limit)
			}
		};
	}

	static async getTimeBasedReport(from, to) {
		// 1. Dữ liệu của kỳ hiện tại
		const cur = await Booking.getCurrentBookingForStatistics(from, to);

		// 2. So sánh kỳ trước (để tính tăng trưởng MoM hoặc WoW)
		const prev = await Booking.getPreviousBookingForStatistics(from, to);

		const revGrowth = prev.revenue > 0 ? (((cur.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : (cur.revenue > 0 ? 100 : 0);
		const bookGrowth = prev.booking_count > 0 ? (((cur.booking_count - prev.booking_count) / prev.booking_count) * 100).toFixed(1) : (cur.booking_count > 0 ? 100 : 0);

		return {
			period: { from, to },
			revenue: parseFloat(cur.revenue),
			booking_count: cur.booking_count,
			confirmed: cur.confirmed, pending: cur.pending, cancelled: cur.cancelled,
			previous: { revenue: parseFloat(prev.revenue), booking_count: prev.booking_count },
			growth: { revenue: parseFloat(revGrowth), booking: parseFloat(bookGrowth) }
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
			sqlExpr = "DATE_FORMAT(created_at, '%m/%Y')";
			let curr = new Date(from);
			curr.setDate(1); // Đặt về ngày 1 để dễ tăng tháng
			const endMonth = new Date(to);
			endMonth.setDate(1);

			while (curr <= endMonth) {
				const mm = String(curr.getMonth() + 1).padStart(2, '0');
				const yyyy = curr.getFullYear();
				labels.push(`${mm}/${yyyy}`);
				curr.setMonth(curr.getMonth() + 1);
			}
		}

		const [rows] = await db.query(`
			SELECT ${sqlExpr} AS label, COALESCE(SUM(total_price), 0) AS revenue
			FROM bookings
			WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
				AND payment_status = 'paid' AND status != 'cancelled'
			GROUP BY label
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
		const overall = await Review.getOverallRating();
		const topRated = await Review.getTopRated();
		return { overall: overall, top_rated_tours: topRated };
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
