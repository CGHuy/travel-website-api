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

// Admin: Cập nhật status (và hoàn trả ghế nếu huỷ)
exports.updateStatus = async (req, res) => {
	try {
		const bookingId = req.params.id;
		const { status, payment_status } = req.body;

		if (status) {
			await Booking.updateStatus(bookingId, "status", status);

			// Hoàn trả ghế khi admin duyệt hủy đơn
			if (status === "cancelled") {
				const booking = await bookingService.getById(bookingId);
				if (booking) {
					// Tự động chuyển sang refunded nếu đang chờ hủy
					if (booking.payment_status === "pending") {
						await Booking.updateStatus(bookingId, "payment_status", "refunded");
					}

					const totalPax = (booking.adults || 0) + (booking.children || 0);
					await db.query(
						`UPDATE tour_departures SET seats_available = seats_available + ? WHERE id = ?`,
						[totalPax, booking.departure_id]
					);
				}
			}
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

// Tìm kiếm booking theo mã tour , mã user, lọc trạng thái (Dành cho nhân viên xem chi tiết booking)
exports.searchBookings = async (req, res) => {
	try {
		const { tour_id, user_id, status } = req.query;
		const bookings = await bookingService.searchBooking(
			user_id,
			tour_id,
			status,
		);
		res.json({ success: true, count: bookings.length, data: bookings });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Lỗi khi tìm kiếm",
			error: error.message,
		});
	}
};

///=============================== USER =======================================================
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

		// Logic Thực tế: Không được hủy nếu tour đã hoặc đang diễn ra
		const departureDate = new Date(booking.departure_date);
		const now = new Date();
		if (departureDate <= now) {
			return res.status(400).json({
				success: false,
				message: "Không thể yêu cầu hủy tour đã hoặc đang diễn ra",
			});
		}

		// Đổi trạng thái sang pending để chờ Admin/Staff duyệt
		await Booking.updateStatus(bookingId, "status", "pending");
		// Cập nhật trạng thái thanh toán sang pending để chờ duyệt hoàn tiền
		await Booking.updateStatus(bookingId, "payment_status", "pending");

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
exports.getBookingsByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const bookings = await bookingService.getBookingsByUserId(userId);
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

// NOTE: requestCancellation đã được tích hợp vào cancelBooking ở trên.
// Hàm này đầy cũ không được sử dụng, giữ comment để tham khảo.


// Bộ nhớ tạm lưu thông tin booking đang chờ thanh toán
const pendingBookingsCache = new Map();

// Tích hợp VNPay: Tạo URL thanh toán
exports.createVNPayUrl = async (req, res) => {
	try {
		const vnpay = new VNPay({
			tmnCode: process.env.VNP_TMN_CODE,
			secureSecret: process.env.VNP_SECURE_SECRET,
			vnpayHost: process.env.VNP_HOST,
			testMode: true,
			hashAlgorithm: "SHA512",
			loggerFn: ignoreLogger,
		});

		// Thiết lập thời gian hết hạn thanh toán (30 phút)
		const expireDate = new Date();
		expireDate.setMinutes(expireDate.getMinutes() + 30);

		// Hiển thị số tiền và Nội dung thanh toán (Tên Tour) tự động
		const { totalPrice: amount, tourName } = await bookingService.infoBooking(
			req.body,
		);
		// VNPay có thể lỗi nếu nội dung chứa ký tự đặc biệt, nên loại bỏ dấu và ký tự lạ
		const safeTourName = tourName.replace(/[^\w\s]/gi, "");
		const orderInfo = `Thanh toan tour ${safeTourName}`.slice(0, 250);
		const uniqueStr = Math.random().toString(36).substring(2, 10).toUpperCase();
		const txnRef = `VNPAY_${Date.now()}_${uniqueStr}`;

		// Lưu dữ liệu vào cache để truy xuất sau khi thanh toán thành công
		pendingBookingsCache.set(txnRef, {
			userId: req.user.id,
			bookingData: req.body,
		});

		// Tự động xóa dữ liệu sau 30 phút để giải phóng bộ nhớ
		setTimeout(() => pendingBookingsCache.delete(txnRef), 30 * 60 * 1000);

		const ipAddr =
			req.headers["x-forwarded-for"] ||
			req.connection.remoteAddress ||
			"127.0.0.1";

		const vnpayResponse = await vnpay.buildPaymentUrl({
			vnp_Amount: amount,
			vnp_IpAddr: ipAddr,
			vnp_TxnRef: txnRef,
			vnp_OrderInfo: orderInfo,
			vnp_OrderType: ProductCode.Other,
			vnp_ReturnUrl: process.env.VNP_RETURN_URL,
			vnp_Locale: VnpLocale.VN,
			vnp_CreateDate: dateFormat(new Date()),
			vnp_ExpireDate: dateFormat(expireDate),
		});

		// Tính tương thích: Bọc kết quả vào JSON có format chuẩn để Frontend nhận diện
		const paymentUrl =
			typeof vnpayResponse === "string"
				? vnpayResponse
				: vnpayResponse.url || vnpayResponse.paymentUrl;

		return res.status(201).json({
			success: true,
			vnpayUrl: paymentUrl || vnpayResponse,
		});
	} catch (error) {
		console.error("VNPay Error:", error);
		res.status(500).json({
			success: false,
			message: "Không thể tạo liên kết thanh toán",
			error: error.message,
		});
	}
};

// VNPay Callback: Xử lý kết quả trả về từ cổng thanh toán
exports.vnpayReturn = async (req, res) => {
	try {
		const vnpay = new VNPay({
			tmnCode: process.env.VNP_TMN_CODE,
			secureSecret: process.env.VNP_SECURE_SECRET,
			vnpayHost: process.env.VNP_HOST,
			hashAlgorithm: "SHA512",
		});

		const verify = vnpay.verifyReturnUrl(req.query);
		const txnRef = req.query.vnp_TxnRef;

		if (verify.isSuccess) {
			let newBookingId = null;

			// Kiểm tra và lấy dữ liệu từ bộ nhớ tạm
			if (pendingBookingsCache.has(txnRef)) {
				const { userId, bookingData } = pendingBookingsCache.get(txnRef);

				try {
					// Khởi tạo booking trong Database sau khi xác nhận thanh toán
					const { bookingId } = await bookingService.createBooking(
						userId,
						bookingData,
					);
					newBookingId = bookingId;

					// Cập nhật trạng thái thanh toán và xác nhận đơn hàng
					await bookingService.confirmPayment(bookingId);

					// Dọn dẹp bộ nhớ tạm
					pendingBookingsCache.delete(txnRef);
				} catch (err) {
					console.error("DB Create Error:", err);
				}
			}

			// Chuyển hướng về trang Kết quả thanh toán trên Frontend
			return res.redirect(
				`/payment-result?status=success&bookingId=${newBookingId}`,
			);
		} else {
			// Xóa dữ liệu tạm nếu giao dịch thất bại hoặc bị hủy
			pendingBookingsCache.delete(txnRef);

			// Chuyển hướng về trang lỗi
			return res.redirect(
				`/payment-result?status=error&message=Giao dịch thất bại hoặc bị hủy`,
			);
		}
	} catch (error) {
		console.error("VNPay Return Error:", error);
		return res.redirect(
			`/payment-result?status=error&message=Lỗi máy chủ khi xử lý thanh toán`,
		);
	}
};
