DELETE FROM tour_itineraries WHERE tour_id IN (20, 21);
DELETE FROM tour_services WHERE tour_id IN (20, 21);
DELETE FROM tour_departures WHERE tour_id IN (20, 21);
DELETE FROM tours WHERE id IN (20, 21);
DELETE FROM users WHERE id = 2;

INSERT INTO users (id, email, password, fullname, phone, role) VALUES
(2, 'phuquoc@gmail.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PQm4sEPhMNPfFhpYN76uO', 'Nguyễn Văn A', '0912345678', 'customer');

INSERT INTO tours (id, name, slug, description, price_default, price_child, region, duration, location) VALUES
(20, 'Tour Phú Quốc 3N2Đ', 'tour-phu-quoc-3n2d', 'Khám phá đảo ngọc Phú Quốc 3 ngày 2 đêm - Bãi Sao - Dinh Cậu - Chợ đêm', 4200000, 2500000, 'Miền Nam', '3 ngày 2 đêm', 'Phú Quốc, Kiên Giang'),
(21, 'Tour Phú Quốc - Nam Đảo 4N3Đ', 'tour-phu-quoc-nam-dao-4n3d', 'Tour Phú Quốc cao cấp khám phá Nam Đảo và các resort', 6800000, 4000000, 'Miền Nam', '4 ngày 3 đêm', 'Phú Quốc, Nam Đảo');

INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES
(200, 20, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Hà Nội', 25, 20, 800000, 500000),
(201, 20, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Hồ Chí Minh', 30, 25, 500000, 300000),
(202, 21, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Hồ Chí Minh', 20, 15, 600000, 400000);

INSERT IGNORE INTO services (id, name, slug, description) VALUES
(4, 'Resort 5 sao', 'resort-5-sao', 'Resort tiêu chuẩn 5 sao với đầy đủ tiện nghi'),
(5, 'Xe đưa đón sân bay', 'xe-dua-don-san-bay', 'Xe đưa đón tận sân bay, đảm bảo đúng giờ');

INSERT INTO tour_services (tour_id, service_id) VALUES (20, 4), (20, 5), (21, 4);

INSERT INTO tour_itineraries (id, tour_id, day_number, description) VALUES
(200, 20, 1, 'Đón khách tại sân bay Phú Quốc, tham quan Dinh Cậu'),
(201, 20, 2, 'Tắm biển Bãi Sao, lặn ngắm san hô tại Hòn Móng Tay'),
(202, 20, 3, 'Tham quan chợ đêm Phú Quốc, mua sắm đặc sản, ra sân bay');
