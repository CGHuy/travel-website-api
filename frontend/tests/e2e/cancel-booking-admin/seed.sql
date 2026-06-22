-- ==========================================================================
-- SEED DATA - Khôi phục dữ liệu cho Test Case Hủy Booking
-- Áp dụng cho:
--   - SC_cancel_TC01_full_flow  (Luồng user hủy → admin phê duyệt → VNPay)
--   - SC_cancel_TC02_full_flow  (Luồng user hủy → admin từ chối → về confirmed)
-- Chạy trước mỗi lần test để đảm bảo data luôn ở trạng thái ban đầu
-- ==========================================================================

-- 1. Đảm bảo departure 43 tồn tại (tour Ninh Bình, khởi hành Hà Nội, 2026-10-18)
INSERT IGNORE INTO tour_departures (id, tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, status)
VALUES (43, 8, 'Hà Nội', '2026-10-18', 150000, 80000, 30, 20, 'open');

-- 2. Reset departure 43 về trạng thái mở và đủ ghế
UPDATE tour_departures
SET
    seats_available = 20,
    status = 'open'
WHERE id = 43;

-- 3. Xóa passenger cũ của booking 88 (nếu có)
DELETE FROM passengers WHERE booking_id = 88;

-- 4. Đảm bảo booking 88 tồn tại (nam, departure 43, trạng thái confirmed)
INSERT IGNORE INTO bookings (id, user_id, departure_id, adults, children, total_price, payment_status, status, contact_name, contact_phone, contact_email, created_at)
VALUES (88, 6, 43, 1, 0, 2350000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com', '2026-04-20 10:00:00');

-- 5. Reset booking 88 (nam) về trạng thái confirmed + paid
UPDATE bookings
SET
    status = 'confirmed',
    payment_status = 'paid',
    updated_at = NOW()
WHERE id = 88;

-- 6. Thêm passenger mặc định cho booking 88
INSERT IGNORE INTO passengers (booking_id, fullname, gender, dob, passenger_type)
VALUES (88, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult');

-- 7. Kiểm tra lại booking (chạy tay nếu cần)
-- SELECT id, status, payment_status, contact_name, total_price
-- FROM bookings WHERE id = 88;
