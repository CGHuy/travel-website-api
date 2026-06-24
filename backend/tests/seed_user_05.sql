-- Xóa tất cả user test của TC_ADMIN_USER_05
SELECT @uid := id FROM users WHERE email LIKE 'nv%@test.com';
DELETE FROM passengers WHERE booking_id IN (SELECT id FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'nv%@test.com'));
DELETE FROM reviews WHERE booking_id IN (SELECT id FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'nv%@test.com'));
DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'nv%@test.com');
DELETE FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'nv%@test.com');
DELETE FROM wishlist WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'nv%@test.com');
DELETE FROM users WHERE email LIKE 'nv%@test.com';
