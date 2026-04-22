const express = require("express");
const router = express.Router();
const tourItineraryController = require("../controllers/tourItineraryController");
const { verifyToken, isTourStaff } = require("../middlewares/auth");
const { validateBulkItineraries } = require("../middlewares/validation/itinerary");

// Lấy danh sách tour kèm lịch trình cho trang admin
router.get("/tours", tourItineraryController.getToursForItineraryManagement);

// Lấy tất cả itinerary của 1 tour
router.get("/:tourId", tourItineraryController.getByTourId);

// Cập nhật toàn bộ lịch trình của 1 tour (PUT /api/tourItinerary/:tourId)
router.put("/:tourId", verifyToken, isTourStaff, validateBulkItineraries, tourItineraryController.updateTourItineraries);

// Xóa toàn bộ lịch trình của 1 tour (DELETE /api/tourItinerary/:tourId)
router.delete("/:tourId", verifyToken, isTourStaff, tourItineraryController.deleteByTourId);

module.exports = router;
