const db = require('../config/database');

class Booking {
     // Lấy tất cả bookings
     static async getAll() {
          try {
               const [rows] = await db.query(`
               SELECT b.*, u.username, u.email, t.name as tour_name, t.price
               FROM bookings b
               JOIN users u ON b.user_id = u.id
               JOIN tours t ON b.tour_id = t.id
               ORDER BY b.created_at DESC
               `);
               return rows;
          } catch (error) {
               throw error;
          }
     }

     // Lấy bookings theo user ID
     static async getByUserId(userId) {
          try {
               const [rows] = await db.query(`
               SELECT b.*, t.name as tour_name, t.price, t.duration, t.region
               FROM bookings b
               JOIN tours t ON b.tour_id = t.id
               WHERE b.user_id = ?
               ORDER BY b.created_at DESC
               `, [userId]);
               return rows;
          } catch (error) {
               throw error;
          }
     }

     // Tạo booking mới
     static async create(bookingData) {
          try {
               const { user_id, tour_id, booking_date, number_of_people, total_price, status = 'pending' } = bookingData;
               
               const [result] = await db.query(
               'INSERT INTO bookings (user_id, tour_id, booking_date, number_of_people, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
               [user_id, tour_id, booking_date, number_of_people, total_price, status]
               );
               
               return result.insertId;
          } catch (error) {
               throw error;
          }
     }

     // Cập nhật trạng thái booking
     static async updateStatus(id, status) {
          try {
               const [result] = await db.query(
               'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
               return result.affectedRows > 0;
          } catch (error) {
               throw error;
          }
     }

     // Xóa booking
     static async delete(id) {
          try {
               const [result] = await db.query('DELETE FROM bookings WHERE id = ?', [id]);
               return result.affectedRows > 0;
          } catch (error) {
               throw error;
          }
     }
}

module.exports = Booking;