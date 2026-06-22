-- ==========================================================================
-- SEED DATA - Khôi phục dữ liệu cho TC_E2E_10 (xóa tour khỏi wishlist)
-- Chạy trước mỗi lần test để đảm bảo DB luôn có wishlist entry
-- ==========================================================================

-- 1. Xóa wishlist cũ của user nam@gmail.com (id = 6)
DELETE FROM wishlist WHERE user_id = 6;

-- 2. Thêm wishlist entry mới để test (tour Nha Trang, id = 4)
INSERT IGNORE INTO wishlist (user_id, tour_id, created_at) VALUES (6, 4, NOW());
