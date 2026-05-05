const db = require("../config/database");

class Tour {
    // Lấy tất cả tours
    static async getAll() {
        try {
            const [rows] = await db.query(`SELECT * FROM tours ORDER BY id DESC`);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy danh sách tour có phân trang và tìm kiếm.
    static async getAllPaginated({ page = 1, limit = 5, keyword = "" } = {}) {
        try {
            const safePage = Number(page);
            const safeLimit = Number(limit);
            const offset = (safePage - 1) * safeLimit;
            const normalizedKeyword = String(keyword || "").trim();

            const whereClause = normalizedKeyword ? `WHERE CAST(id AS CHAR) LIKE ? OR CONCAT('TOUR', LPAD(id, 3, '0')) LIKE ? OR name LIKE ? OR region LIKE ?` : "";

            const searchPattern = `%${normalizedKeyword}%`;
            const whereParams = normalizedKeyword ? [searchPattern, searchPattern, searchPattern, searchPattern] : [];

            const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM tours ${whereClause}`, whereParams);
            const total = Number(countRows[0]?.total || 0);
            const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
            const currentPage = Math.min(safePage, totalPages);
            const currentOffset = (currentPage - 1) * safeLimit;

            const [rows] = await db.query(`SELECT * FROM tours ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...whereParams, safeLimit, currentOffset]);

            return {
                data: rows,
                pagination: {
                    currentPage,
                    totalPages,
                    total,
                    limit: safeLimit,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    // Lấy tours theo region
    static async getByRegion(region) {
        try {
            const [rows] = await db.query(`SELECT * FROM tours WHERE region = ? ORDER BY id DESC`, [region]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy tour theo ID
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tours WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo tour mới
    static async create(tourData) {
        try {
            const { name, slug, description, price_default, price_child, region, duration, location, image } = tourData;
            const [result] = await db.query(`INSERT INTO tours (name, slug, description, price_default, price_child, region, duration, location, cover_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [name, slug, description, price_default, price_child, region, duration, location, image]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật tour
    static async update(id, tourData) {
        try {
            const { name, description, price_default, price_child, region, duration, location, image } = tourData;
            const [result] = await db.query(`UPDATE tours SET name = ?, description = ?, price_default = ?, price_child = ?, region = ?, duration = ?, location = ?, cover_image = ?, updated_at = NOW() WHERE id = ?`, [name, description, price_default, price_child, region, duration, location, image, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa tour
    static async delete(id) {
        try {
            const [result] = await db.query(
                `
                DELETE FROM tours WHERE id = ?`,
                [id],
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Lấy name, location, region, duration, cover_image, price_default, price_child theo tourId
    static async getTourInfoForBookingById(id) {
        try {
            const [rows] = await db.query(
                `
                SELECT id, name, location, region, duration, cover_image, price_default, price_child FROM tours WHERE id = ?`,
                [id],
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Thống kê
    static async totalTours() {
        try {
            const [rows] = await db.query(`SELECT COUNT(*) AS total_tours FROM tours`);
            return rows[0].total_tours;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Tour;
