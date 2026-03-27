const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken, isAdmin, isUser, isBookingManager } = require("../middlewares/auth");
const { validateBooking } = require("../middlewares/validation/booking");

// User routes - Cần đăng nhập
router.post("/", verifyToken, isUser, validateBooking, bookingController.createBooking);
router.get("/my-bookings", verifyToken, isUser, bookingController.getMyBookings);
router.put("/:id/cancel", verifyToken, isUser, bookingController.cancelBooking);

// Admin / Booking Manager routes - Cần quyền quản lý
router.get("/", verifyToken, isBookingManager, bookingController.getAllBookings);
router.put("/:id/status", verifyToken, isBookingManager, bookingController.updateStatus);
router.delete("/:id", verifyToken, isBookingManager, bookingController.deleteBooking);

module.exports = router;
