const db = require("../config/database");

class TourItinerary {
    // Lấy danh sách tour cho màn quản lý lịch trình (summary) với hỗ trợ phân trang
    static async getTourItineraryManagementList(keyword = "", page = 1, limit = 5) {
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

            // Count total matching tours (without JOIN aggregation)
            const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM tours t ${whereClause}`, whereParams);
            const total = Number(countRows[0]?.total || 0);

            const totalPages = Math.max(Math.ceil(total / limit), 1);
            const currentPage = Math.min(page, totalPages);
            const offSet = (currentPage - 1) * limit;

            // Fetch paginated summary with itinerary counts
            const [rows] = await db.query(
                `
                SELECT
                    t.id,
                    CONCAT('TOUR', LPAD(t.id, 3, '0')) AS code,
                    t.name,
                    COUNT(ti.id) AS itinerary_count
                FROM tours t
                LEFT JOIN tour_itineraries ti ON ti.tour_id = t.id
                ${whereClause}
                GROUP BY t.id, t.name
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

    // Lấy tất cả itinerary
    static async getAll() {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_itineraries ORDER BY tour_id ASC, day_number ASC`);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy tất cả itinerary của 1 tour
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_itineraries WHERE tour_id = ? ORDER BY day_number ASC`, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy itinerary theo id
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_itineraries WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo itinerary mới
    static async create(itineraryData) {
        try {
            const { tour_id, day_number, description } = itineraryData;
            const [result] = await db.query(`INSERT INTO tour_itineraries (tour_id, day_number, description) VALUES (?, ?, ?)`, [tour_id, day_number, description]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật itinerary
    static async update(id, itineraryData) {
        try {
            const { tour_id, day_number, description } = itineraryData;
            const [result] = await db.query(`UPDATE tour_itineraries SET tour_id = ?, day_number = ?, description = ? WHERE id = ?`, [tour_id, day_number, description, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa itinerary
    static async delete(id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_itineraries WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa tất cả itinerary của 1 tour
    static async deleteByTourId(tour_id) {
        try {
            const [result] = await db.query(`DELETE FROM tour_itineraries WHERE tour_id = ?`, [tour_id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TourItinerary;
