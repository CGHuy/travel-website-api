const db = require("../config/database");
const Departure = require("../models/Departure");
const Tour = require("../models/Tour");
const Booking = require("../models/Booking");

class bookingService {
	//================== USER ===================

	// Lấy danh sách booking đã đặt của người dùng (Hỗ trợ tìm kiếm & phân trang)
	static async getBookingsByUserId(userId, page = 1, limit = 10, search = "") {
		try {
			const offset = (page - 1) * limit;
			let whereClause = " WHERE b.user_id = ?";
			const params = [userId];

			if (search) {
				whereClause += " AND (t.name LIKE ? OR CAST(b.id AS CHAR) LIKE ?)";
				const searchVal = `%${search}%`;
				params.push(searchVal, searchVal);
			}

			// Lấy tổng số lượng
			const countQuery = `
				SELECT COUNT(*) as total 
				FROM bookings b
				JOIN tour_departures td ON b.departure_id = td.id
				JOIN tours t ON td.tour_id = t.id
				${whereClause}
			`;
			const [countResult] = await db.query(countQuery, params);
			const totalItems = countResult[0].total;
			const totalPages = Math.ceil(totalItems / limit);

			// Lấy dữ liệu
			const dataQuery = `
				SELECT 
                    b.id,
                    t.name as tour_name,
                    t.cover_image,
                    td.departure_date,
                    td.departure_location,
                    b.adults,
                    b.children,
                    b.total_price,
                    b.status as booking_status,
                    b.payment_status,
                    b.created_at
                FROM bookings b
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                ${whereClause}
                ORDER BY b.created_at DESC
				LIMIT ? OFFSET ?
			`;
			
			const dataParams = [...params, parseInt(limit), parseInt(offset)];
			const [rows] = await db.query(dataQuery, dataParams);

			return {
				data: rows,
				pagination: {
					totalItems,
					totalPages,
					currentPage: parseInt(page),
					limit: parseInt(limit)
				}
			};
		} catch (error) {
			throw error;
		}
	}

	// Kiểm tra xem user có booking đã hoàn thành (đã đi) cho tour này chưa
	static async checkCompletedBooking(userId, tourId) {
		try {
			const [rows] = await db.query(
				`SELECT b.id 
                 FROM bookings b
                 JOIN tour_departures td ON b.departure_id = td.id
                 WHERE b.user_id = ? AND td.tour_id = ? 
                 AND b.status = 'confirmed' 
                 AND b.payment_status = 'paid'
                 AND td.departure_date <= NOW()
                 LIMIT 1`,
				[userId, tourId],
			);
			return rows.length > 0;
		} catch (error) {
			throw error;
		}
	}

	// Xem chi tiết booking mà người dùng đã đặt
	static async getBookingDetailsByUserId(bookingId, userId) {
		try {
			// Lấy chi tiết booking kèm theo thông tin tour và danh sách hành khách
			const [rows] = await db.query(
				`SELECT 
                    b.*, 
                    t.id as tour_id,
                    t.name as tour_name, 
                    t.cover_image as tour_image,
                    t.duration as tour_duration,
                    t.price_default,
                    t.price_child,
                    td.departure_date,
                    td.departure_location,
                    td.price_moving,
                    td.price_moving_child,
                    p.id as passenger_id,
                    p.fullname as passenger_fullname,
                    p.gender as passenger_gender,
                    DATE_FORMAT(p.dob, '%Y-%m-%d') as passenger_dob,
                    p.passenger_type,
                    (SELECT COUNT(id) FROM reviews r WHERE r.user_id = b.user_id AND r.tour_id = t.id) > 0 as is_reviewed
                FROM bookings b
                LEFT JOIN passengers p ON p.booking_id = b.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.id = ? AND b.user_id = ?`,
				[bookingId, userId],
			);

			if (rows.length === 0) return null;

			// Lấy các thông tin cơ bản của booking từ phần tử đầu tiên
			const booking = { ...rows[0], passengers: [] };

			// Xử lý và map các row thành một mảng khách hàng
			if (rows[0].passenger_id) {
				booking.passengers = rows.map(row => ({
					id: row.passenger_id,
					fullname: row.passenger_fullname,
					gender: row.passenger_gender,
					dob: row.passenger_dob,
					passenger_type: row.passenger_type
				}));
			}

			// Dọn dẹp các field phụ để object booking được gọn
			delete booking.passenger_id;
			delete booking.passenger_fullname;
			delete booking.passenger_gender;
			delete booking.passenger_dob;
			delete booking.passenger_type;

			return booking;
		} catch (error) {
			throw error;
		}
	}

	//================== ADMIN ===================

	// 1. Lấy tất cả bookings (Dành cho Admin) - Hỗ trợ phân trang, lọc trạng thái và tìm kiếm
	static async getAll(page = 1, limit = 10, status = null, search = "") {
		try {
			const offset = (page - 1) * limit;
			let whereClause = " WHERE 1=1";
			const params = [];

			if (status && status !== "all") {
				whereClause += " AND b.status = ?";
				params.push(status);
			}

			if (search) {
				whereClause += " AND (u.fullname LIKE ? OR u.email LIKE ? OR CAST(b.id AS CHAR) LIKE ? OR b.contact_name LIKE ? OR t.name LIKE ?)";
				const searchVal = `%${search}%`;
				params.push(searchVal, searchVal, searchVal, searchVal, searchVal);
			}

			// Lấy tổng số lượng để tính totalPages
			const countQuery = `
				SELECT COUNT(*) as total 
				FROM bookings b
				LEFT JOIN users u ON b.user_id = u.id
				JOIN tour_departures td ON b.departure_id = td.id
				JOIN tours t ON td.tour_id = t.id
				${whereClause}
			`;
			const [countResult] = await db.query(countQuery, params);
			const totalItems = countResult[0].total;
			const totalPages = Math.ceil(totalItems / limit);

			// Lấy dữ liệu
			const dataQuery = `
                SELECT 
                    b.*, 
                    u.fullname, 
                    u.email as user_email, 
                    t.name as tour_name, 
                    t.price_default,
                    td.departure_date
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                ${whereClause}
                ORDER BY b.id DESC
                LIMIT ? OFFSET ?
            `;
			
			const dataParams = [...params, parseInt(limit), parseInt(offset)];
			const [rows] = await db.query(dataQuery, dataParams);

			return {
				data: rows,
				pagination: {
					totalItems,
					totalPages,
					currentPage: parseInt(page),
					limit: parseInt(limit)
				}
			};
		} catch (error) {
			throw error;
		}
	}

	// 1.5 Lấy booking theo ID (Dành cho xem chi tiết, Danh cho Admin)
	static async getById(id) {
		try {
			const [rows] = await db.query(
				`SELECT 
                    b.*, 
                    u.fullname as user_fullname, 
                    u.email as user_email, 
                    u.phone as user_phone,
                    t.id as tour_id,
                    t.name as tour_name, 
					t.cover_image as tour_image,
                    t.duration as tour_duration,
                    t.price_default,
                    t.price_child,
                    td.departure_date,
                    td.departure_location,
                    td.price_moving,
                    td.price_moving_child,
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', c.id,
                                'fullname', c.fullname,
                                'gender', c.gender,
                                'dob', DATE_FORMAT(c.dob, '%Y-%m-%d'),
                                'passenger_type', c.passenger_type
                            )
                        )
                        FROM passengers c
                        WHERE c.booking_id = b.id
                    ) as passengers
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.id = ?`,
				[id],
			);

			if (rows.length === 0) return null;

			const booking = rows[0];

			if (typeof booking.passengers === "string") {
				booking.passengers = JSON.parse(booking.passengers);
			}

			return booking;
		} catch (error) {
			console.error("Error in bookingService.getById:", error);
			throw error;
		}
	}

	// 2. Lấy bookings theo user ID (Dành cho khách hàng xem lịch sử) - Che
	static async getByUserId(userId) {
		try {
			const [rows] = await db.query(
				`
                SELECT 
                    b.*, 
                    t.name as tour_name, 
                    t.cover_image,
                    td.departure_date,
                    td.departure_location
                FROM bookings b
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
            `,
				[userId],
			);
			return rows;
		} catch (error) {
			throw error;
		}
	}

	// 3. Xác nhận thanh toán và cập nhật trạng thái đơn hàng
	static async confirmPayment(bookingId) {
		try {
			// Cập nhật cả 2 trạng thái trong một lần
			await Booking.updateStatus(bookingId, "payment_status", "paid");
			await Booking.updateStatus(bookingId, "status", "confirmed");
			return true;
		} catch (error) {
			console.error("Lỗi service confirmPayment:", error);
			throw error;
		}
	}

	// Tính toán trước tổng tiền của một booking và tiêu đề thanh toán
	static async infoBooking(bookingData) {
		const { departure_id, adults, children = 0 } = bookingData;

		const dep = await Departure.getById(departure_id);
		if (!dep) throw new Error("Lịch khởi hành không tồn tại");

		// Thêm kiểm tra ngày khởi hành ở Backend (tránh lách luật từ Frontend)
		const depDate = new Date(dep.departure_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (depDate < today) {
			throw new Error("Lịch khởi hành này đã qua ngày, không thể đặt tour.");
		}

		const tour = await Tour.getById(dep.tour_id);
		if (!tour) throw new Error("Không tìm thấy thông tin Tour");

		const adultUnitPrice =
			parseFloat(tour.price_default) + parseFloat(dep.price_moving);
		const childUnitPrice =
			parseFloat(tour.price_child) + parseFloat(dep.price_moving_child);

		const totalPrice =
			parseInt(adults) * adultUnitPrice + parseInt(children) * childUnitPrice;
		return { totalPrice, tourName: tour.name };
	}

	// 4. Khởi tạo Booking
	static async createBooking(user_id, bookingData) {
		const {
			departure_id,
			adults,
			children = 0,
			contact_name,
			contact_phone,
			contact_email,
			contact_dob,
			contact_gender,
			note,
			passengers,
		} = bookingData;
		//Kiểm tra trước khi tạo booking
		const totalPax = parseInt(adults) + parseInt(children);
		const dep = await Departure.getById(departure_id);
		if (!dep) {
			throw new Error("Lịch khởi hành không tồn tại");
		}

		// Bảo mật kép ở khâu Create Booking
		const depDate = new Date(dep.departure_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (depDate < today) {
			throw new Error("Lịch khởi hành này đã qua ngày, không thể đặt tour.");
		}

		if (totalPax > dep.seats_available) {
			throw new Error("Số lượng khách vượt quá chỗ trống hiện tại");
		}

		// Gọi qua bảng Tour để lấy giá gốc
		const tour = await Tour.getById(dep.tour_id);
		if (!tour) {
			throw new Error("Không tìm thấy thông tin Tour");
		}

		// Tính tổng giá
		const adultUnitPrice =
			parseFloat(tour.price_default) + parseFloat(dep.price_moving);
		const childUnitPrice =
			parseFloat(tour.price_child) + parseFloat(dep.price_moving_child);
		const total_price =
			parseInt(adults) * adultUnitPrice + parseInt(children) * childUnitPrice;

		// Sử dụng Transaction
		const conn = await db.getConnection();
		try {
			await conn.beginTransaction();

			// 2.1 Tạo booking (contact_dob không lưu ở đây, lưu ở bảng passengers)
			const [bookingResult] = await conn.query(
				`INSERT INTO bookings (user_id, departure_id, adults, children, total_price, contact_name, contact_phone, contact_email, note)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					user_id,
					departure_id,
					adults,
					children,
					total_price,
					contact_name,
					contact_phone,
					contact_email,
					note,
				],
			);
			const bookingId = bookingResult.insertId;

			// 2.2 Insert người liên hệ là hành khách đầu tiên (adult)
			await conn.query(
				`INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type)
				VALUES (?, ?, ?, ?, 'adult')`,
				[
					bookingId,
					contact_name,
					contact_gender || "Khác",
					contact_dob || null,
				],
			);

			// 2.3 Insert các hành khách còn lại (từ người thứ 2 trở đi)
			if (passengers && passengers.length > 0) {
				for (const p of passengers) {
					await conn.query(
						`INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type)
						VALUES (?, ?, ?, ?, ?)`,
						[bookingId, p.name, p.gender || "Khác", p.dob || null, p.type],
					);
				}
			}

			// 2.4 Trừ số chỗ trống của departure
			await conn.query(
				`UPDATE tour_departures SET seats_available = seats_available - ? WHERE id = ?`,
				[totalPax, departure_id],
			);

			await conn.commit();
			return { bookingId, total_price };
		} catch (error) {
			await conn.rollback();
			throw error;
		} finally {
			conn.release();
		}
	}
	// Tìm kiếm booking theo mã booking , user id và lọc trạng thái

	static async searchBooking(userId, tourId, status) {
		try {
			let query = `
				SELECT 
                    b.*, 
                    u.fullname, 
                    u.email as user_email, 
                    t.name as tour_name, 
                    t.price_default,
                    td.departure_date
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                JOIN tour_departures td ON b.departure_id = td.id
                JOIN tours t ON td.tour_id = t.id
                WHERE 1=1
			`;
			const params = [];

			if (userId) {
				query += " AND b.user_id = ?";
				params.push(userId);
			}

			if (tourId) {
				query += " AND t.id = ?";
				params.push(tourId);
			}

			if (status) {
				query += " AND b.status = ?";
				params.push(status);
			}

			query += " ORDER BY b.created_at DESC";

			const [rows] = await db.query(query, params);
			return rows;
		} catch (error) {
			throw error;
		}
	
}
// 5. Tính toán thông tin hoàn tiền dựa trên chính sách
	static async calculateRefundInfo(bookingId) {
		try {
			const booking = await this.getById(bookingId);
			if (!booking) throw new Error("Không tìm thấy booking");

			// Ngày yêu cầu hủy (updated_at là lúc trạng thái chuyển sang pending)
			const reqDate = new Date(booking.updated_at || booking.created_at);
			const depDate = new Date(booking.departure_date);
			
			const timeDiff = depDate.getTime() - reqDate.getTime();
			const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
			
			let penaltyPercent = 0;
			if (daysDiff >= 30) {
				penaltyPercent = 0;
			} else if (daysDiff >= 15 && daysDiff < 30) {
				penaltyPercent = 50;
			} else {
				penaltyPercent = 100;
			}
			
			const penaltyAmount = (booking.total_price * penaltyPercent) / 100;
			const refundAmount = booking.total_price - penaltyAmount;
			
			return {
				totalPrice: booking.total_price,
				daysDiff,
				penaltyPercent,
				penaltyAmount,
				refundAmount
			};
		} catch (error) {
			throw error;
		}
	}
}

module.exports = bookingService;
