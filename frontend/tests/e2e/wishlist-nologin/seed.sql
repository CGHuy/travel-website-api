-- ==========================================================================
-- SEED DATA - Khôi phục dữ liệu cho TC_E2E_11 (wishlist khi chưa login)
-- ==========================================================================

-- Xóa wishlist cũ của user nam@gmail.com (id = 6)
DELETE FROM wishlist WHERE user_id = 6;
