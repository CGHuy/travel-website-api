const db = require("../config/database");

class Wishlist {
    // Lấy tất cả wishlist của 1 user
    static async getByUserId(user_id) {
        try {
            const [rows] = await db.query(
                `SELECT w.*, t.name as tour_name, t.cover_image FROM wishlist w JOIN tours t ON w.tour_id = t.id WHERE w.user_id = ? ORDER BY w.created_at DESC`,
                [user_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Kiểm tra tour đã có trong wishlist của user chưa
    static async exists(user_id, tour_id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM wishlist WHERE user_id = ? AND tour_id = ?`,
                [user_id, tour_id]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    // Thêm tour vào wishlist
    static async add(user_id, tour_id) {
        try {
            const [result] = await db.query(
                `INSERT INTO wishlist (user_id, tour_id, created_at) VALUES (?, ?, NOW())`,
                [user_id, tour_id]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Xóa tour khỏi wishlist
    static async remove(user_id, tour_id) {
        try {
            const [result] = await db.query(
                `DELETE FROM wishlist WHERE user_id = ? AND tour_id = ?`,
                [user_id, tour_id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Wishlist;
