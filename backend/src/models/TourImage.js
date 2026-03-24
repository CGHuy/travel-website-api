const db = require("../config/database");

class TourImage {
    // Lấy tất cả ảnh của tour
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM tour_images WHERE tour_id = ? ORDER BY id ASC`,
                [tour_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy ảnh theo ID
    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM tour_images WHERE id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Thêm ảnh mới cho tour
    static async create({ tour_id, image }) {
        try {
            const [result] = await db.query(
                `INSERT INTO tour_images (tour_id, image) VALUES (?, ?)`,
                [tour_id, image]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Xóa ảnh theo ID
    static async delete(id) {
        try {
            const [result] = await db.query(
                `DELETE FROM tour_images WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TourImage;
