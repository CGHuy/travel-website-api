-- ==========================================================================
-- SEED DATA - Khôi phục dữ liệu cho TC_E2E_09 (wishlist + book tour)
-- Chạy trước mỗi lần test để đảm bảo DB luôn ở trạng thái ban đầu
-- ==========================================================================

-- 1. Xóa booking gần nhất của user nam@gmail.com (id = 6)
DELETE FROM passengers WHERE booking_id IN (
    SELECT id FROM (SELECT id FROM bookings WHERE user_id = 6 ORDER BY created_at DESC LIMIT 1) tmp
);
DELETE FROM bookings WHERE user_id = 6 ORDER BY created_at DESC LIMIT 1;

-- 2. Xóa wishlist của user nam@gmail.com (id = 6) cho tour đã test (tour id = 4)
DELETE FROM wishlist WHERE user_id = 6 AND tour_id = 4;
