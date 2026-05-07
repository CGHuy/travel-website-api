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

    // Lấy danh sách tour có phân trang, tìm kiếm, và lọc theo region và giá.
    static async getAllPaginated({ page = 1, limit = 5, keyword = "", region = "", priceMax = null } = {}) {
        try {
            page = Number(page);
            limit = Number(limit);
            const normalizedKeyword = String(keyword || "").trim();
            const normalizedRegion = String(region || "").trim();
            const safePriceMax = priceMax != null ? Number(priceMax) : null;

            // Xây dựng WHERE clause từ các điều kiện
            const whereConditions = [];
            const whereParams = [];

            // Điều kiện tìm kiếm keyword
            if (normalizedKeyword) {
                whereConditions.push(`(CAST(id AS CHAR) LIKE ? OR CONCAT('TOUR', LPAD(id, 3, '0')) LIKE ? OR name LIKE ?)`);
                const searchPattern = `%${normalizedKeyword}%`;
                whereParams.push(searchPattern, searchPattern, searchPattern);
            }

            // Điều kiện lọc theo region
            if (normalizedRegion) {
                whereConditions.push(`region = ?`);
                whereParams.push(normalizedRegion);
            }

            // Điều kiện lọc theo giá
            // Giá = 10000000 được dùng làm giá mặc định "10M+" (không lọc)
            if (Number.isFinite(safePriceMax) && safePriceMax >= 0 && safePriceMax < 10000000) {
                whereConditions.push(`price_default <= ?`);
                whereParams.push(safePriceMax);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

            const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM tours ${whereClause}`, whereParams);
            const total = Number(countRows[0]?.total || 0);
            const totalPages = Math.max(Math.ceil(total / limit), 1);
            const currentPage = Math.min(page, totalPages);
            const offSet = (currentPage - 1) * limit;

            const [rows] = await db.query(`SELECT * FROM tours ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...whereParams, limit, offSet]);

            return {
                data: rows,
                pagination: {
                    currentPage,
                    totalPages,
                    total,
                    limit,
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
