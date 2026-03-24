const db = require("../config/database");

class Departure {
    // Lấy tất cả departures
    static async getAll() {
        try {
            const [rows] = await db.query(`SELECT * FROM departures ORDER BY departure_date DESC`);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    //Lấy departures theo tour_id
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM departures WHERE tour_id = ? ORDER BY departure_date DESC`, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy departure theo ID
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM departures WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo departure mới
    static async create(departureData) {
        try {
            const { tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total } = departureData;
            const seats_available = seats_total; // Ban đầu, số chỗ trống bằng tổng số chỗ
            const [result] = await db.query(
                `
                INSERT INTO departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, available_seats, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())
                `,
                [tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available],
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật departure
    static async update(id, departureData) {
        try {
            const { tour_id, departure_location, departure_date, price_moving, price_moving_child, available_seats } = departureData;
            const [result] = await db.query(`UPDATE departures SET tour_id = ?, departure_location = ?, departure_date = ?, price_moving = ?, price_moving_child = ?, available_seats = ?, updated_at = NOW() WHERE id = ?`, [tour_id, departure_location, departure_date, price_moving, price_moving_child, available_seats, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa departure
    static async delete(id) {
        try {
            const [result] = await db.query(`DELETE FROM departures WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}
