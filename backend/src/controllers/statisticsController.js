const StatisticsService = require("../services/statisticsService");

class StatisticsController {
	// ════════════ REAL-TIME ════════════

	// GET /api/stats/realtime
	static async getRealTime(req, res) {
		try {
			const data = await StatisticsService.getRealTimeStats();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getRealTime error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu real-time" });
		}
	}

	// GET /api/stats/occupancy
	static async getTourOccupancy(req, res) {
		try {
			const data = await StatisticsService.getTourOccupancy();
			res.json({ success: true, data });
		} catch (error) {
			console.error("getTourOccupancy error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê lấp đầy" });
		}
	}

	// ════════════ TIME-BASED ════════════

	// GET /api/stats/report?from=YYYY-MM-DD&to=YYYY-MM-DD
	static async getReport(req, res) {
		try {
			const { from, to } = req.query;
			if (!from || !to) {
				return res.status(400).json({ success: false, message: "Thiếu tham số from/to" });
			}
			const data = await StatisticsService.getTimeBasedReport(from, to);
			res.json({ success: true, data });
		} catch (error) {
			console.error("getReport error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy báo cáo" });
		}
	}

	// GET /api/stats/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
	static async getRevenue(req, res) {
		try {
			const { from, to } = req.query;
			if (!from || !to) {
				return res.status(400).json({ success: false, message: "Thiếu tham số from/to" });
			}
			const data = await StatisticsService.getRevenueChartData(from, to);
			res.json({ success: true, data });
		} catch (error) {
			console.error("getRevenue error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê doanh thu" });
		}
	}

	// GET /api/stats/bookings/status?from=YYYY-MM-DD&to=YYYY-MM-DD
	static async getBookingStatus(req, res) {
		try {
			const { from, to } = req.query;
			if (!from || !to) {
				return res.status(400).json({ success: false, message: "Thiếu tham số from/to" });
			}
			const data = await StatisticsService.getBookingStatusByPeriod(from, to);
			res.json({ success: true, data });
		} catch (error) {
			console.error("getBookingStatus error:", error);
			res.status(500).json({ success: false, message: "Lỗi lấy thống kê booking" });
		}
	}

	// ════════════ ANALYTICS ════════════

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
}

module.exports = StatisticsController;
