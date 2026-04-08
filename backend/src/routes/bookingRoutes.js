const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const {
	verifyToken,
	isAdmin,
	isUser,
	isBookingStaff,
	isOwner,
} = require("../middlewares/auth");
const { validateBooking } = require("../middlewares/validation/booking");

//============================== User routes - Cần đăng nhập=====================

// Xem danh sach booking ma user da dat
router.get(
	"/my-bookings",
	verifyToken,
	isUser,
	bookingController.getBookingsByUserId,
);

// Xem chi tiết booking ma user da dat
router.get(
	"/:id/details",
	verifyToken,
	isUser,
	bookingController.getBookingDetailsByUserId,
);

// User gui yeu cau huy booking
router.put(
	"/:id/cancel",
	verifyToken,
	isUser,
	bookingController.cancelBooking,
);

///===================================================================
// Booking Staff routes - Cần quyền quản lý
router.get("/", verifyToken, isBookingStaff, bookingController.getAllBookings);

router.put(
	"/:id/status",
	verifyToken,
	isBookingStaff,
	bookingController.updateStatus,
);

router.get(
	"/search",
	verifyToken,
	isBookingStaff,
	bookingController.searchBookings,
);

router.get("/:id", verifyToken, bookingController.getBookingDetails);

module.exports = router;
