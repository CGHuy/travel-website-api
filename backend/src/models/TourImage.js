const db = require("../config/database");

class TourImage {
    // Lấy danh sách tour cho màn quản lý ảnh (summary) với phân trang
    static async getTourImageManagementList(keyword = "", page = 1, limit = 5) {
        try {
            page = Number(page) || 1;
            limit = Number(limit) || 5;

            const normalizedKeyword = String(keyword || "")
                .trim()
                .toLowerCase();
            const likeKeyword = `%${normalizedKeyword}%`;

            const whereConditions = [];
            const whereParams = [];

            if (normalizedKeyword) {
                whereConditions.push(`(CAST(t.id AS CHAR) LIKE ? OR LOWER(CONCAT('tour', LPAD(t.id, 3, '0'))) LIKE ? OR LOWER(COALESCE(t.name, '')) LIKE ? OR LOWER(COALESCE(t.region, '')) LIKE ?)`);
                whereParams.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

            // Count total matching tours
            const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM tours t ${whereClause}`, whereParams);
            const total = Number(countRows[0]?.total || 0);

            const totalPages = Math.max(Math.ceil(total / limit), 1);
            const currentPage = Math.min(page, totalPages);
            const offSet = (currentPage - 1) * limit;

            const [rows] = await db.query(
                `
                SELECT
                    t.id,
                    CONCAT('TOUR', LPAD(t.id, 3, '0')) AS code,
                    t.name,
                    t.region,
                    t.cover_image,
                    COUNT(ti.id) AS image_count
                FROM tours t
                LEFT JOIN tour_images ti ON ti.tour_id = t.id
                ${whereClause}
                GROUP BY t.id, t.name, t.region, t.cover_image
                ORDER BY t.id DESC
                LIMIT ? OFFSET ?
                `,
                [...whereParams, limit, offSet],
            );

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

    // Lấy tất cả ảnh của tour
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_images WHERE tour_id = ? ORDER BY id ASC`, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy ảnh theo ID
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_images WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Thêm ảnh mới cho tour
    static async create({ tour_id, image }) {
        try {
            const [result] = await db.query(`INSERT INTO tour_images (tour_id, image) VALUES (?, ?)`, [tour_id, image]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Xóa ảnh theo ID
    static async delete(id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_images WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TourImage;
