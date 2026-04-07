const express = require("express");
const router = express.Router({ mergeParams: true }); // Cho phép kế thừa params từ parent route
const tourItineraryController = require("../controllers/tourItineraryController");
const { verifyToken, isAdmin } = require("../middlewares/auth");
const { validateBulkItineraries } = require("../middlewares/validation/itinerary");

// Lấy tất cả itinerary của 1 tour
router.get("/", tourItineraryController.getByTourId);

// Cập nhật toàn bộ lịch trình của 1 tour (PUT /api/tourItinerary/:tourId)
router.put("/", verifyToken, isAdmin, validateBulkItineraries, tourItineraryController.updateTourItineraries);

// Xóa toàn bộ lịch trình của 1 tour (DELETE /api/tourItinerary/:tourId)
router.delete("/", verifyToken, isAdmin, tourItineraryController.deleteByTourId);

module.exports = router;
