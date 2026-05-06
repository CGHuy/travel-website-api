const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { validateBookingTour } = require("../middlewares/validation/booking");
const { verifyToken, isUser, isBookingStaff, isCustomer } = require("../middlewares/auth");

//============================== User routes - Cần đăng nhập=====================

// Xem danh sách booking mà user đã đặt
router.get(
	"/my-bookings",
	verifyToken,
	isUser,
	bookingController.getBookingsByUserId,
);

// Xem chi tiết booking mà user đã đặt
router.get(
	"/:id/details",
	verifyToken,
	isUser,
	bookingController.getBookingDetailsByUserId,
);

// Người dùng gửi yêu cầu hủy booking
router.put("/:id/cancel", verifyToken, isUser, bookingController.cancelBooking);

///===================================================================
// Booking Staff routes - Cần quyền quản lý
router.get("/", verifyToken, isBookingStaff, bookingController.getAllBookings);

// Cập nhật trạng thái booking
router.put(
	"/:id/status",
	verifyToken,
	isBookingStaff,
	bookingController.updateStatus,
);

//============================== VNPay Callback - Không cần token =====================
// QUAN TRỌNG: Phải đặt TRƯỚC route /:id để tránh bị match với parametrized route

// Callback thanh toán booking từ VNPay
router.get("/vnpay-return", bookingController.vnpayReturn);

// Callback hoàn tiền từ VNPay
router.get("/vnpay-refund", bookingController.vnpayRefundReturn);

//============================== Tích hợp VNPay - Người dùng =====================

// Tạo URL thanh toán VNPay cho booking
router.post(
	"/create-payment-url",
	verifyToken,
	isCustomer,
	validateBookingTour,
	bookingController.createVNPayUrl,
);

// Tìm kiếm booking theo mã tour, mã user, lọc trạng thái
router.get(
	"/search",
	verifyToken,
	isBookingStaff,
	bookingController.searchBookings,
);

// Tạo URL hoàn tiền qua VNPay
router.post("/create-refund-url", verifyToken, isBookingStaff, bookingController.createRefundUrl);

//============================== Route có tham số - Phải đặt cuối cùng =====================

// Xem chi tiết booking theo ID
router.get("/:id", verifyToken, bookingController.getBookingDetails);

module.exports = router;
