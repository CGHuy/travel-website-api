-- Đảm bảo tour ID=19 tồn tại và reset về trạng thái ban đầu
INSERT IGNORE INTO tours (id, name, slug, location, price_default, price_child, region, duration, description) VALUES (19, 'Tour du lịch Củ Chi 3 ngày 2 đêm', 'tour-cu-chi-test', 'TP.HCM', 3500000, 2500000, 'Miền Nam', '3 ngày 2 đêm', 'Tour tham quan các địa điểm nổi tiếng tại Củ Chi');
UPDATE tours SET name = 'Tour du lịch Củ Chi 3 ngày 2 đêm', price_default = 3500000, price_child = 2500000, region = 'Miền Nam', duration = '3 ngày 2 đêm', description = 'Tour tham quan các địa điểm nổi tiếng tại Củ Chi' WHERE id = 19;
