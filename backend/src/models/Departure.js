const db = require("../config/database");

class Departure {
    // Lấy tất cả departures
    static async getAll() {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures ORDER BY departure_date DESC`);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    //Lấy departures theo tour_id
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures WHERE tour_id = ? ORDER BY departure_date DESC`, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    //Lấy departures theo tour_id sao cho ngày khởi hành lớn hơn ngày hiện tại và còn trống chỗ
    static async getByTourIdAndAvailable(tour_id) {
        try {
            const [rows] = await db.query(`
                SELECT * FROM tour_departures 
                WHERE tour_id = ? AND departure_date >= CURDATE() AND seats_available > 0
                ORDER BY departure_date DESC
            `, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy departure theo ID
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures WHERE id = ?`, [id]);
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
                INSERT INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
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
            const { tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, status } = departureData;
            const [result] = await db.query(`UPDATE tour_departures SET tour_id = ?, departure_location = ?, departure_date = ?, price_moving = ?, price_moving_child = ?, seats_total = ?, seats_available = ?, status = ?, updated_at = NOW() WHERE id = ?`, [tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, status, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa departure
    static async delete(id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_departures WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Departure;
