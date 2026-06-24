-- Xóa nhân viên test nếu tồn tại
-- Phải xóa child tables trước do FK constraints
SELECT @uid := id FROM users WHERE email = 'nhanvientc01@viettravel.com';

DELETE FROM passengers WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = @uid);
DELETE FROM reviews WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = @uid);
DELETE FROM reviews WHERE user_id = @uid;
DELETE FROM bookings WHERE user_id = @uid;
DELETE FROM wishlist WHERE user_id = @uid;
DELETE FROM users WHERE id = @uid;
