const express = require("express");
const router = express.Router();
const StatisticsController = require("../controllers/statisticsController");
const {verifyToken, isAdmin} = require("../middlewares/auth");

// ═══ REAL-TIME ═══
router.get("/realtime", verifyToken, isAdmin, StatisticsController.getRealTime);
router.get("/occupancy", verifyToken, isAdmin, StatisticsController.getTourOccupancy);

// ═══ TIME-BASED ═══
router.get("/report", verifyToken, isAdmin, StatisticsController.getReport);
router.get("/revenue", verifyToken, isAdmin, StatisticsController.getRevenue);
router.get("/bookings/status", verifyToken, isAdmin, StatisticsController.getBookingStatus);

// ═══ ANALYTICS ═══
router.get("/tours/top", StatisticsController.getTopTours);
router.get("/reviews", verifyToken, isAdmin, StatisticsController.getReviewStats);
router.get("/users", verifyToken, isAdmin, StatisticsController.getUserStats);
router.get("/years", verifyToken, isAdmin, StatisticsController.getYears);

module.exports = router;
