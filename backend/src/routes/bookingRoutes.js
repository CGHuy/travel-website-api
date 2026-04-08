const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { validateBookingTour } = require("../middlewares/validation/booking");
const {
	verifyToken,
	isAdmin,
	isUser,
	isBookingStaff,
	isOwner,
} = require("../middlewares/auth");


// User routes - Cần đăng nhập
router.post(
	"/",
	verifyToken,
	isUser,
	validateBookingTour,
	bookingController.createBooking,
);
router.get(
	"/my-bookings",
	verifyToken,
	isUser,
	bookingController.getMyBookings,
);

router.get(
	"/:id/details",
	verifyToken,
	isUser,
	bookingController.getBookingDetailsByUserId,
);

router.put(
	"/:id/cancel",
	verifyToken,
	isUser,
	bookingController.requestCancellation,
);

// Booking Staff routes - Cần quyền quản lý
router.get("/", verifyToken, isBookingStaff, bookingController.getAllBookings);

router.put(
	"/:id/status",
	verifyToken,
	isBookingStaff,
	bookingController.updateStatus,
);

// Integrations
router.post("/create-qr", verifyToken, isUser, bookingController.createVNPayUrl);
router.get("/vnpay-return", bookingController.vnpayReturn);

router.get("/:id", verifyToken, bookingController.getBookingDetails);

module.exports = router;
