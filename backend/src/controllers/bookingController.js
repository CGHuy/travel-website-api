const Booking = require("../models/Booking");
const bookingService = require("../services/bookingService");
const db = require("../config/database"); // Cần db để check tồn tại/tính giá
const {
	VNPay,
	ignoreLogger,
	ProductCode,
	VnpLocale,
	dateFormat,
} = require("vnpay");

// Tạo booking mới
exports.createBooking = async (req, res) => {
	try {
		const user_id = req.user.id;
		const result = req.body;
		const { bookingId, total_price } = await bookingService.createBooking(
			user_id,
			result,
		);
		res.status(201).json({
			success: true,
			message: "Đặt tour thành công!",
			data: { id: bookingId, total_price },
		});
	} catch (error) {
		console.error("Create booking error:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi khi đặt tour",
			error: error.message,
		});
	}
};

// Lấy chi tiết booking (Dành cho nhân viên xem chi tiết booking)
exports.getBookingDetails = async (req, res) => {
	try {
		const bookingId = req.params.id;
		const booking = await bookingService.getById(bookingId);
		if (!booking) {
			return res
				.status(404)
				.json({ success: false, message: "Không tìm thấy booking" });
		}
		res.json({ success: true, data: booking });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi lấy chi tiết",
			error: error.message,
		});
	}
};

// Admin: Lấy tất cả
exports.getAllBookings = async (req, res) => {
	try {
		const bookings = await bookingService.getAll();
		res.json({ success: true, count: bookings.length, data: bookings });
	} catch (error) {
		res
			.status(500)
			.json({ success: false, message: "Lỗi server", error: error.message });
	}
};

// Admin: Cập nhật status
exports.updateStatus = async (req, res) => {
	try {
		const bookingId = req.params.id;
		const { status, payment_status } = req.body;

		if (status) {
			await Booking.updateStatus(bookingId, "status", status);
		}
		if (payment_status) {
			await Booking.updateStatus(bookingId, "payment_status", payment_status);
		}

		res.json({ success: true, message: "Cập nhật thành công" });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi cập nhật",
			error: error.message,
		});
	}
};

// Gửi yêu cầu hủy booking (User)
exports.cancelBooking = async (req, res) => {
	try {
		const bookingId = req.params.id;
		const userId = req.user.id;

		const booking = await bookingService.getById(bookingId);

		if (!booking) {
			return res
				.status(404)
				.json({ success: false, message: "Không tìm thấy booking" });
		}

		// Kiểm tra quyền
		if (booking.user_id !== userId) {
			return res.status(403).json({
				success: false,
				message: "Bạn không có quyền thao tác trên booking này",
			});
		}

		if (booking.status === "pending") {
			return res
				.status(400)
				.json({ success: false, message: "Yêu cầu hủy đang được chờ xử lý" });
		}

		if (booking.status === "cancelled") {
			return res
				.status(400)
				.json({ success: false, message: "Booking này đã bị hủy" });
		}

		if (booking.status !== "confirmed") {
			return res.status(400).json({
				success: false,
				message: "Chỉ có thể yêu cầu hủy khi booking đã xác nhận",
			});
		}

		// Đổi trạng thái sang pending để chờ Admin/Staff duyệt
		await Booking.updateStatus(bookingId, "status", "pending");

		res.json({
			success: true,
			message: "Đã gửi yêu cầu hủy booking thành công",
		});
	} catch (error) {
		console.error("Cancel booking error:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi khi gửi yêu cầu hủy booking",
			error: error.message,
		});
	}
};

// Lấy danh sách bookings của user hiện tại
exports.getMyBookings = async (req, res) => {
	try {
		const userId = req.user.id;
		const bookings = await bookingService.getByUserId(userId);
		res.json({ success: true, count: bookings.length, data: bookings });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi lấy danh sách",
			error: error.message,
		});
	}
};

exports.getBookingDetailsByUserId = async (req, res) => {
	try {
		const bookingId = req.params.id;
		const userId = req.user.id;
		const booking = await bookingService.getBookingDetailsByUserId(
			bookingId,
			userId,
		);
		if (!booking) {
			return res
				.status(404)
				.json({ success: false, message: "Không tìm thấy booking" });
		}
		res.json({ success: true, data: booking });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi lấy chi tiết",
			error: error.message,
		});
	}
};

// User gửi yêu cầu hủy booking (chuyển trạng thái sang pending)

exports.requestCancellation = async (req, res) => {
	try {
		const bookingId = req.params.id;
		const userId = req.user.id;

		const booking = await Booking.getById(bookingId);
		if (!booking) {
			return res
				.status(404)
				.json({ success: false, message: "Không tìm thấy booking" });
		}
		if (booking.status === "pending") {
			return res
				.status(400)
				.json({ success: true, message: "Gửi yêu cầu hủy thành công" });
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi gửi yêu cầu hủy booking",
			error: error.message,
		});
	}
};

// Danh sách chờ để chứa Booking Data tạm thời trước khi VNPay xác nhận (Cách 3)
const pendingBookingsCache = new Map();

exports.createVNPayUrl = async (req, res) => {
	try {
		const vnpay = new VNPay({
			tmnCode: process.env.VNP_TMN_CODE,
			secureSecret: process.env.VNP_SECURE_SECRET,
			vnpayHost: process.env.VNP_HOST,
			testMode: true, // tùy chọn
			hashAlgorithm: "SHA512", // tùy chọn
			loggerFn: ignoreLogger, // tùy chọn
		});

		// Tính toán thời gian hết hạn (ví dụ: 15 phút sau hoặc ngày mai như trong ảnh)
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const amount = req.body.amount || 50000;
		const orderInfo = req.body.orderInfo || "123456";
		// Đảm bảo mã đơn hàng là duy nhất bằng thời gian thực tế kết hợp với chuỗi ngẫu nhiên
		const uniqueStr = Math.random().toString(36).substring(2, 10).toUpperCase();
		const txnRef = req.body.txnRef || `VNPAY_${Date.now()}_${uniqueStr}`;

		// -- ÁP DỤNG CÁCH 3 Ở ĐÂY --
		// Lưu tạm dữ liệu form vào bộ nhớ RAM của Server với khoá là txnRef
		pendingBookingsCache.set(txnRef, {
			userId: req.user.id,
			bookingData: req.body // Bao gồm adults, children, list hành khách...
		});
		
		// Tự động xoá dữ liệu này sau 30 phút để giải phóng bộ nhớ nếu user không thanh toán
		setTimeout(() => pendingBookingsCache.delete(txnRef), 30 * 60 * 1000);
		// --------------------------

		// Dùng IP của client, nếu chạy local thì thường ra ::1 hoặc 127.0.0.1
		const ipAddr =
			req.headers["x-forwarded-for"] ||
			req.connection.remoteAddress ||
			"127.0.0.1";

		const vnpayResponse = await vnpay.buildPaymentUrl({
			vnp_Amount: amount,
			vnp_IpAddr: ipAddr,
			vnp_TxnRef: txnRef, // Mã đơn hàng luôn luôn là duy nhất mỗi lần gọi
			vnp_OrderInfo: orderInfo,
			vnp_OrderType: ProductCode.Other,
			vnp_ReturnUrl: process.env.VNP_RETURN_URL, 
			vnp_Locale: VnpLocale.VN,
			vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
			vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
		});

		return res.status(201).json(vnpayResponse);
	} catch (error) {
		console.error("VNPay create URL error:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi tạo URL thanh toán VNPay",
			error: error.message,
		});
	}
};

exports.vnpayReturn = async (req, res) => {
	try {
		const vnpay = new VNPay({
			tmnCode: process.env.VNP_TMN_CODE,
			secureSecret: process.env.VNP_SECURE_SECRET,
			vnpayHost: process.env.VNP_HOST,
			hashAlgorithm: "SHA512",
		});

		const verify = vnpay.verifyReturnUrl(req.query);
		if (verify.isSuccess) {
			const txnRef = req.query.vnp_TxnRef;
			let newBookingId = null;

			// -- ÁP DỤNG CÁCH 3 Ở ĐÂY --
			// VNPay báo thành công -> Lấy dữ liệu tạm ra và tạo Booking thật
			if (pendingBookingsCache.has(txnRef)) {
				const { userId, bookingData } = pendingBookingsCache.get(txnRef);
				
				try {
					// Việc trừ số ghế và tính giá sẽ chạy ở phía service
					const { bookingId } = await bookingService.createBooking(userId, bookingData);
					newBookingId = bookingId;

					// Cập nhật trạng thái "Đã thanh toán"
					await Booking.updateStatus(bookingId, "payment_status", "paid");
					await Booking.updateStatus(bookingId, "status", "confirmed");
					
					// Đã tạo DB thành công nên xoá trong Cache tạm đi
					pendingBookingsCache.delete(txnRef);
				} catch (err) {
					console.error("Lỗi khi tạo booking thật:", err);
				}
			}
			// -------------------------

			// Thanh toán thành công
			// Ở đây bạn nên cập nhật trạng thái đơn hàng trong DB
			return res.status(200).json({
				success: true,
				message: "Thanh toán thành công qua VNPay",
				newBookingId: newBookingId,
				data: verify,
			});
		} else {
			// Xoá Cache tạm do người dùng huỷ thanh toán
			const txnRef = req.query.vnp_TxnRef;
			if (pendingBookingsCache.has(txnRef)) {
				pendingBookingsCache.delete(txnRef);
			}

			// Thanh toán thất bại hoặc chữ ký không hợp lệ
			return res.status(400).json({
				success: false,
				message: "Thanh toán thất bại hoặc phản hồi không hợp lệ",
				data: verify,
			});
		}
	} catch (error) {
		console.error("VNPay return error:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi xử lý phản hồi từ VNPay",
			error: error.message,
		});
	}
};

