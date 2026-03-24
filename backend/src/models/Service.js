const db = require("../config/database");

class Service {
    // Lấy tất cả services
    static async getAll() {
        try {
            const [rows] = await db.query(
                `SELECT * FROM services ORDER BY created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy service theo id
    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM services WHERE id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo service mới
    static async create(serviceData) {
        try {
            const { name, slug, description, status = 1 } = serviceData;
            const [result] = await db.query(
                `INSERT INTO services (name, slug, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [name, slug, description, status]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật service
    static async update(id, serviceData) {
        try {
            const { name, slug, description, status } = serviceData;
            const [result] = await db.query(
                `UPDATE services SET name = ?, slug = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?`,
                [name, slug, description, status, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa service
    static async delete(id) {
        try {
            const [result] = await db.query(
                `DELETE FROM services WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Service;
