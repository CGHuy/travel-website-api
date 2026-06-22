-- Seed dữ liệu departure cho TC_ADMIN_TOUR_04
-- Tour ID=19 cần có departure để test xóa thất bại
INSERT INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available)
VALUES
(19, 'TP.HCM - Bến Xe Miền Đông', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 200000, 150000, 20, 20),
(19, 'Sân bay Tân Sơn Nhất',   DATE_ADD(CURDATE(), INTERVAL 45 DAY), 500000, 300000, 15, 15);
