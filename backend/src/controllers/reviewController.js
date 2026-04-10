const Review = require("../models/Review");

// Lấy danh sách đánh giá của user hiện tại
exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviews = await Review.getByUserId(userId);

        return res.json({
            success: true,
            message: "Lấy danh sách đánh giá thành công!",
            data: reviews
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đánh giá",
            error: error.message
        });
    }
};

// Tạo đánh giá mới
exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tour_id, rating, comment } = req.body;

        // Kiểm tra xem đã review tour này chưa
        const existingReview = await Review.getByUserAndTour(userId, tour_id);
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã để lại đánh giá cho chuyến đi này rồi!"
            });
        }

        const reviewData = {
            user_id: userId,
            tour_id,
            rating,
            comment
        };

        const insertId = await Review.create(reviewData);

        return res.status(201).json({
            success: true,
            message: "Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.",
            data: { id: insertId, ...reviewData }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi khi gửi đánh giá",
            error: error.message
        });
    }
};

// Xóa đánh giá
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;

        // Kiểm tra xem review có thuộc về user không
        const review = await Review.getById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đánh giá"
            });
        }

        if (review.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa đánh giá này"
            });
        }

        const success = await Review.delete(reviewId);
        if (success) {
            return res.json({
                success: true,
                message: "Xóa đánh giá thành công!"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Xóa đánh giá thất bại"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi khi xóa đánh giá",
            error: error.message
        });
    }
};

// Cập nhật đánh giá
exports.updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;
        const { rating, comment } = req.body;

        // Kiểm tra xem review có tồn tại và thuộc về user không
        const review = await Review.getById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đánh giá"
            });
        }

        if (review.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền sửa đánh giá này"
            });
        }

        const success = await Review.update(reviewId, { rating, comment });
        if (success) {
            return res.json({
                success: true,
                message: "Cập nhật đánh giá thành công!"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Cập nhật đánh giá thất bại hoặc không có thay đổi"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật đánh giá",
            error: error.message
        });
    }
};
