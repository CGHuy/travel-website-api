const Booking = require("../models/Booking");
const bookingService = require("../services/bookingService");
const db = require("../config/database"); // Cần db để check tồn tại/tính giá

// Tạo booking mới
exports.createBooking = async (req, res) => {
	try {
		const {
			departure_id,
			adults,
			children = 0,
			contact_name,
			contact_phone,
			contact_email,
			note,
		} = req.body;
		const user_id = req.user.id;

		// 1. Kiểm tra tour departure có tồn tại và còn chỗ không
		const [departures] = await db.query(
			`
            SELECT td.*, t.price_default, t.price_child 
            FROM tour_departures td 
            JOIN tours t ON td.tour_id = t.id 
            WHERE td.id = ?`,
			[departure_id],
		);

		const departure = departures[0];
		if (!departure) {
			return res
				.status(404)
				.json({ success: false, message: "Không tìm thấy lịch khởi hành" });
		}

		if (departure.seats_available < parseInt(adults) + parseInt(children)) {
			return res.status(400).json({
				success: false,
				message: "Không đủ chỗ trống cho số lượng người đã chọn",
			});
		}

		// 2. Tính tổng tiền
		const total_price =
			adults * departure.price_default + children * departure.price_child;

		// 3. Tạo booking
		const bookingId = await Booking.create({
			user_id,
			departure_id,
			adults,
			children,
			total_price,
			contact_name,
			contact_phone,
			contact_email,
			note,
		});

		// 4. Cập nhật số chỗ trống (Optionally, should be in a transaction)
		await db.query(
			`UPDATE tour_departures SET seats_available = seats_available - ? WHERE id = ?`,
			[parseInt(adults) + parseInt(children), departure_id],
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
