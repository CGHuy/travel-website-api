const db = require("../config/database");

class TourItinerary {
    // Lấy tất cả itinerary của 1 tour
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM tour_itineraries WHERE tour_id = ? ORDER BY day_number ASC`,
                [tour_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy itinerary theo id
    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM tour_itineraries WHERE id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo itinerary mới
    static async create(itineraryData) {
        try {
            const { tour_id, day_number, description } = itineraryData;
            const [result] = await db.query(
                `INSERT INTO tour_itineraries (tour_id, day_number, description) VALUES (?, ?, ?)`,
                [tour_id, day_number, description]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật itinerary
    static async update(id, itineraryData) {
        try {
            const { tour_id, day_number, description } = itineraryData;
            const [result] = await db.query(
                `UPDATE tour_itineraries SET tour_id = ?, day_number = ?, description = ? WHERE id = ?`,
                [tour_id, day_number, description, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa itinerary
    static async delete(id) {
        try {
            const [result] = await db.query(
                `DELETE FROM tour_itineraries WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TourItinerary;
