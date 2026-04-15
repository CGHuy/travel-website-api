const db = require("../config/database");

class Review {
    // Lấy review theo id
    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM reviews WHERE id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Lấy review theo user_id
    static async getByUserId(user_id) {
        try {
            const [rows] = await db.query(
                `SELECT r.*, t.name as tour_name, b.id as booking_id
                 FROM reviews r 
                 JOIN tours t ON r.tour_id = t.id 
                 LEFT JOIN bookings b ON r.booking_id = b.id
                 WHERE r.user_id = ? 
                 ORDER BY r.created_at DESC`,
                [user_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy review theo user và tour
    static async getByUserAndTour(user_id, tour_id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM reviews WHERE user_id = ? AND tour_id = ?`,
                [user_id, tour_id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo review mới
    static async create(reviewData) {
        try {
            const { user_id, tour_id, rating, comment, booking_id } = reviewData;
            const [result] = await db.query(
                `INSERT INTO reviews (user_id, tour_id, rating, comment, booking_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
                [user_id, tour_id, rating, comment, booking_id]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật review
    static async update(id, reviewData) {
        try {
            const { rating, comment } = reviewData;
            const [result] = await db.query(
                `UPDATE reviews SET rating = ?, comment = ? WHERE id = ?`,
                [rating, comment, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
    // Lấy danh sách review theo tour_id
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(
                `SELECT r.*, u.fullname as user_name
                 FROM reviews r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.tour_id = ?
                 ORDER BY r.created_at DESC`,
                [tour_id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // == Thống kê ==
    static async getOverallRating() {
        try {
            const [rows] = await db.query(`SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total_reviews,
				COUNT(CASE WHEN rating = 5 THEN 1 END) AS star5, COUNT(CASE WHEN rating = 4 THEN 1 END) AS star4,
				COUNT(CASE WHEN rating = 3 THEN 1 END) AS star3, COUNT(CASE WHEN rating = 2 THEN 1 END) AS star2,
				COUNT(CASE WHEN rating = 1 THEN 1 END) AS star1
			FROM reviews`);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getTopRated() {
        try {
            const [rows] = await db.query(`SELECT t.id, t.name, t.region, t.cover_image, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
			FROM tours t JOIN reviews r ON r.tour_id = t.id
			GROUP BY t.id, t.name, t.region, t.cover_image HAVING review_count >= 1
			ORDER BY avg_rating DESC, review_count DESC LIMIT 5`);
            return rows;
        } catch (error) {
            throw error;
        }
    }
        
}

module.exports = Review;
