const express = require("express");
const router = express.Router();
const StatisticsController = require("../controllers/statisticsController");

// ═══ REAL-TIME ═══
router.get("/realtime", StatisticsController.getRealTime);
router.get("/occupancy", StatisticsController.getTourOccupancy);

// ═══ TIME-BASED ═══
router.get("/report", StatisticsController.getReport);
router.get("/revenue", StatisticsController.getRevenue);
router.get("/bookings/status", StatisticsController.getBookingStatus);

// ═══ ANALYTICS ═══
router.get("/tours/top", StatisticsController.getTopTours);
router.get("/reviews", StatisticsController.getReviewStats);
router.get("/users", StatisticsController.getUserStats);
router.get("/years", StatisticsController.getYears);

module.exports = router;
