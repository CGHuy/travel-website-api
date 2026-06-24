-- Đảm bảo tour ID=19 tồn tại + có departure
INSERT IGNORE INTO tours (id, name, slug, location, price_default, price_child, region, duration, description) VALUES (19, 'Tour du lịch Củ Chi 3 ngày 2 đêm', 'tour-cu-chi-test', 'TP.HCM', 3500000, 2500000, 'Miền Nam', '3 ngày 2 đêm', 'Tour tham quan các địa điểm nổi tiếng tại Củ Chi');
INSERT IGNORE INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, status) VALUES (19, 'TP.HCM', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 150000, 80000, 30, 20, 'open');
