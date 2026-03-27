const Booking = require("../models/Booking");
const db = require("../config/database"); // Cần db để check tồn tại/tính giá

// Tạo booking mới
exports.createBooking = async (req, res) => {
    try {
        const { 
            departure_id, adults, children = 0, 
            contact_name, contact_phone, contact_email, note 
        } = req.body;
        const user_id = req.user.id;

        // 1. Kiểm tra tour departure có tồn tại và còn chỗ không
        const [departures] = await db.query(`
            SELECT td.*, t.price_default, t.price_child 
            FROM tour_departures td 
            JOIN tours t ON td.tour_id = t.id 
            WHERE td.id = ?`, [departure_id]);
        
        const departure = departures[0];
        if (!departure) {
            return res.status(404).json({ success: false, message: "Không tìm thấy lịch khởi hành" });
        }

        if (departure.seats_available < (parseInt(adults) + parseInt(children))) {
            return res.status(400).json({ success: false, message: "Không đủ chỗ trống cho số lượng người đã chọn" });
        }

        // 2. Tính tổng tiền
        const total_price = (adults * departure.price_default) + (children * departure.price_child);

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
            note
        });

        // 4. Cập nhật số chỗ trống (Optionally, should be in a transaction)
        await db.query(`UPDATE tour_departures SET seats_available = seats_available - ? WHERE id = ?`, 
            [(parseInt(adults) + parseInt(children)), departure_id]);

        res.status(201).json({
            success: true,
            message: "Đặt tour thành công!",
            data: { id: bookingId, total_price },
        });
    } catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi đặt tour", error: error.message });
    }
};

// Lấy danh sách bookings của user hiện tại
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await Booking.getByUserId(userId);
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách", error: error.message });
    }
};

// Hủy booking (Người dùng tự hủy)
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;
        const booking = await Booking.getById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Không tìm thấy booking" });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ success: false, message: "Không có quyền" });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Booking đã được hủy trước đó" });
        }

        await Booking.updateStatus(bookingId, "status", "cancelled");

        // Hoàn lại chỗ trống
        await db.query(`UPDATE tour_departures SET seats_available = seats_available + ? WHERE id = ?`, 
            [(booking.adults + booking.children), booking.departure_id]);

        res.json({ success: true, message: "Hủy thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi hủy", error: error.message });
    }
};

// Admin: Lấy tất cả
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.getAll();
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
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
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật", error: error.message });
    }
};

// Xóa booking
exports.deleteBooking = async (req, res) => {
    try {
        await Booking.delete(req.params.id);
        res.json({ success: true, message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi xóa", error: error.message });
    }
};
