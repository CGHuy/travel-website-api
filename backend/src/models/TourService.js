const db = require("../config/database");

class TourService {
    // Lấy tất cả service của 1 tour
    static async getServicesByTourId(tour_id) {
        try {
            const [rows] = await db.query(
                `SELECT s.* FROM tour_services ts JOIN services s ON ts.service_id = s.id WHERE ts.tour_id = ?`,
                [tour_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy tất cả tour sử dụng 1 service
    static async getToursByServiceId(service_id) {
        try {
            const [rows] = await db.query(
                `SELECT t.* FROM tour_services ts JOIN tours t ON ts.tour_id = t.id WHERE ts.service_id = ?`,
                [service_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Thêm service vào tour
    static async addServiceToTour(tour_id, service_id) {
        try {
            const [result] = await db.query(
                `INSERT INTO tour_services (tour_id, service_id) VALUES (?, ?)`,
                [tour_id, service_id]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Xóa service khỏi tour
    static async removeServiceFromTour(tour_id, service_id) {
        try {
            const [result] = await db.query(
                `DELETE FROM tour_services WHERE tour_id = ? AND service_id = ?`,
                [tour_id, service_id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TourService;
