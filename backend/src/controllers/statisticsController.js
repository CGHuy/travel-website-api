const StatisticsService = require("../services/statisticsService");

class StatisticsController {
	// GET /api/stats/overview
	static async getOverview(req, res) {
		try {
			const data = await StatisticsService.getOverview();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getOverview error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê tổng quan" });
		}
	}

	// GET /api/stats/revenue?year=2025
	static async getRevenue(req, res) {
		try {
			const year = parseInt(req.query.year) || null;
			const data = await StatisticsService.getRevenueByMonth(year);
			res.json({ success: true, data });
		} catch (error) {
			console.error("getRevenue error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê doanh thu" });
		}
	}

	// GET /api/stats/tours/top?limit=10
	static async getTopTours(req, res) {
		try {
			const limit = parseInt(req.query.limit) || 10;
			const data = await StatisticsService.getTopTours(limit);
			res.json({ success: true, data });
		} catch (error) {
			console.error("getTopTours error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy top tour" });
		}
	}

	// GET /api/stats/bookings/status
	static async getBookingStatus(req, res) {
		try {
			const data = await StatisticsService.getBookingStatusStats();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getBookingStatus error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê booking" });
		}
	}

	// GET /api/stats/users
	static async getUserStats(req, res) {
		try {
			const data = await StatisticsService.getUserStats();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getUserStats error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê người dùng" });
		}
	}

	// GET /api/stats/reviews
	static async getReviewStats(req, res) {
		try {
			const data = await StatisticsService.getReviewStats();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getReviewStats error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê đánh giá" });
		}
	}

	// GET /api/stats/tours/occupancy
	static async getTourOccupancy(req, res) {
		try {
			const data = await StatisticsService.getTourOccupancy();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getTourOccupancy error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê lấp đầy" });
		}
	}
}

module.exports = StatisticsController;
