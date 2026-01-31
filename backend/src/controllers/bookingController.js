const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

// Tạo booking mới
exports.createBooking = async (req, res) => {
     try {
          const { tour_id, booking_date, number_of_people } = req.body;
          const user_id = req.user.id;

          // Kiểm tra tour có tồn tại không
          const tour = await Tour.getById(tour_id);
          if (!tour) {
               return res.status(404).json({
               success: false,
               message: 'Không tìm thấy tour'
               });
          }

          // Tính tổng tiền
          const total_price = tour.price * number_of_people;

          // Tạo booking
          const bookingId = await Booking.create({
               user_id,
               tour_id,
               booking_date,
               number_of_people,
               total_price,
               status: 'pending'
          });

          res.status(201).json({
               success: true,
               message: 'Đặt tour thành công!',
               data: {
               id: bookingId,
               tour_name: tour.name,
               booking_date,
               number_of_people,
               total_price,
               status: 'pending'
               }
          });
     } catch (error) {
          console.error('Create booking error:', error);
          res.status(500).json({
               success: false,
               message: 'Lỗi khi đặt tour',
               error: error.message
          });
     }
};

// Lấy danh sách bookings của user hiện tại
exports.getMyBookings = async (req, res) => {
     try {
          const userId = req.user.id;
          const bookings = await Booking.getByUserId(userId);

          res.json({
               success: true,
               count: bookings.length,
               data: bookings
          });
     } catch (error) {
          console.error('Get my bookings error:', error);
          res.status(500).json({
               success: false,
               message: 'Lỗi khi lấy danh sách đặt tour',
               error: error.message
          });
     }
};

// Hủy booking (chỉ hủy được booking của mình)
exports.cancelBooking = async (req, res) => {
     try {
          const bookingId = req.params.id;
          const userId = req.user.id;

          // Lấy booking để kiểm tra quyền sở hữu
          const booking = await Booking.getById(bookingId);
          
          if (!booking) {
               return res.status(404).json({
               success: false,
               message: 'Không tìm thấy booking'
               });
          }

          // Kiểm tra quyền sở hữu
          if (booking.user_id !== userId && req.user.role !== 'admin') {
               return res.status(403).json({
               success: false,
               message: 'Bạn không có quyền hủy booking này'
               });
          }

          // Chỉ được hủy booking đang pending
          if (booking.status !== 'pending') {
               return res.status(400).json({
               success: false,
               message: 'Chỉ có thể hủy booking đang chờ xác nhận'
               });
          }

          // Cập nhật status thành cancelled
          await Booking.updateStatus(bookingId, 'cancelled');

          res.json({
               success: true,
               message: 'Hủy booking thành công'
          });
     } catch (error) {
          console.error('Cancel booking error:', error);
          res.status(500).json({
               success: false,
               message: 'Lỗi khi hủy booking',
               error: error.message
          });
     }
};

// Lấy tất cả bookings (Admin only)
exports.getAllBookings = async (req, res) => {
     try {
          const bookings = await Booking.getAll();

          res.json({
               success: true,
               count: bookings.length,
               data: bookings
          });
     } catch (error) {
          console.error('Get all bookings error:', error);
          res.status(500).json({
               success: false,
               message: 'Lỗi khi lấy danh sách bookings',
               error: error.message
          });
     }
};

// Cập nhật trạng thái booking (Admin only)
exports.updateStatus = async (req, res) => {
     try {
          const bookingId = req.params.id;
          const { status } = req.body;

          // Validate status
          const validStatuses = ['pending', 'confirmed', 'cancelled'];
          if (!validStatuses.includes(status)) {
               return res.status(400).json({
               success: false,
               message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: pending, confirmed, cancelled'
               });
          }

          const updated = await Booking.updateStatus(bookingId, status);

          if (!updated) {
               return res.status(404).json({
               success: false,
               message: 'Không tìm thấy booking'
               });
          }

          res.json({
               success: true,
               message: 'Cập nhật trạng thái thành công'
          });
     } catch (error) {
          console.error('Update booking status error:', error);
          res.status(500).json({
               success: false,
               message: 'Lỗi khi cập nhật trạng thái',
               error: error.message
          });
     }
};

// Xóa booking (Admin only)
exports.deleteBooking = async (req, res) => {
     try {
          const bookingId = req.params.id;

          const deleted = await Booking.delete(bookingId);

          if (!deleted) {
               return res.status(404).json({
               success: false,
               message: 'Không tìm thấy booking'
               });
          }

          res.json({
               success: true,
               message: 'Xóa booking thành công'
          });
     } catch (error) {
          console.error('Delete booking error:', error);
          res.status(500).json({
               success: false,
               message: 'Lỗi khi xóa booking',
               error: error.message
          });
     }
};