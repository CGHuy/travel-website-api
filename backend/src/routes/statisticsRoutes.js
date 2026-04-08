const express = require("express");
const router = express.Router();
const StatisticsController = require("../controllers/statisticsController");

// Tất cả route thống kê (nên thêm middleware verifyToken + isAdmin sau)
router.get("/overview", StatisticsController.getOverview);
router.get("/revenue", StatisticsController.getRevenue);
router.get("/tours/top", StatisticsController.getTopTours);
router.get("/tours/occupancy", StatisticsController.getTourOccupancy);
router.get("/bookings/status", StatisticsController.getBookingStatus);
router.get("/users", StatisticsController.getUserStats);
router.get("/reviews", StatisticsController.getReviewStats);

module.exports = router;
