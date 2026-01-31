const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
     // Tìm user theo email
     static async findByEmail(email) {
          try {
               const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
               return rows[0];
          } catch (error) {
               throw error;
          }
     }

     // Tìm user theo ID
     static async findById(id) {
          try {
               const [rows] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
               return rows[0];
          } catch (error) {
               throw error;
          }
     }

     // Tạo user mới
     static async create(userData) {
          try {
               const { username, email, password, role = 'user' } = userData;
               
               // Hash password
               const hashedPassword = await bcrypt.hash(password, 10);
               
               const [result] = await db.query(
               'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
               [username, email, hashedPassword, role]);
               
               return result.insertId;
          } catch (error) {
               throw error;
          }
     }

     // Xác thực password
     static async comparePassword(plainPassword, hashedPassword) {
          return await bcrypt.compare(plainPassword, hashedPassword);
     }

     // Lấy tất cả users (cho admin)
     static async getAll() {
          try {
               const [rows] = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY id DESC');
               return rows;
          } catch (error) {
               throw error;
          }
     }

     // Cập nhật user
     static async update(id, userData) {
          try {
               const { username, email, role } = userData;
               const [result] = await db.query('UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
               [username, email, role, id]);
               return result.affectedRows > 0;
          } catch (error) {
               throw error;
          }
     }

     // Xóa user
     static async delete(id) {
          try {
               const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
               return result.affectedRows > 0;
          } catch (error) {
               throw error;
          }
     }
}

module.exports = User;