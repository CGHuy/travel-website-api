const db = require("../config/database");

class TourService {
    // Lấy tất cả service theo tour_id
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_services WHERE tour_id = ?`, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy tất cả tour theo service_id
    static async getByServiceId(service_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_services WHERE service_id = ?`, [service_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy 1 liên kết theo id
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_services WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo liên kết tour-service mới
    static async create(data) {
        try {
            const { tour_id, service_id } = data;
            const [result] = await db.query(`INSERT INTO tour_services (tour_id, service_id) VALUES (?, ?)`, [tour_id, service_id]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Xóa liên kết theo id
    static async delete(id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_services WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa tất cả liên kết theo tour_id
    static async deleteByTourId(tour_id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_services WHERE tour_id = ?`, [tour_id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Xóa tất cả liên kết theo service_id
    static async deleteByServiceId(service_id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_services WHERE service_id = ?`, [service_id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TourService;
