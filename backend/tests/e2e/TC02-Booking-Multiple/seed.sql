DELETE FROM tour_itineraries WHERE tour_id IN (40);
DELETE FROM tour_services WHERE tour_id IN (40);
DELETE FROM tour_images WHERE tour_id IN (40);
DELETE FROM tour_departures WHERE tour_id IN (40);
DELETE FROM tours WHERE id IN (40);
DELETE FROM users WHERE id = 3;

DELETE FROM tour_departures WHERE id = 99;
INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES
(99, 2, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Hồ Chí Minh', 30, 25, 700000, 450000);
INSERT INTO tours (id, name, slug, description, price_default, price_child, region, duration, location, cover_image) VALUES
(40, 'Tour Cà Mau 2N1Đ', 'tour-ca-mau', 'Khám phá Cà Mau - Rừng tràm Trà Sư - Chợ nổi Cái Răng 2 ngày 1 đêm', 2500000, 1500000, 'Miền Nam', '2 ngày 1 đêm', 'Cà Mau, Cần Thơ',
 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281041/travel-website/dalat.jpg');
INSERT INTO tour_images (tour_id, image) VALUES
(40, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281041/travel-website/dalat.jpg'),
(40, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281043/travel-website/dalat-2.jpg'),
(40, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281042/travel-website/dalat-3.jpg');
INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES
(400, 40, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Hồ Chí Minh', 25, 20, 300000, 200000),
(401, 40, DATE_ADD(CURDATE(), INTERVAL 21 DAY), 'Cần Thơ', 25, 18, 100000, 50000);
INSERT INTO tour_services (tour_id, service_id) VALUES (40, 1), (40, 2), (40, 3);
INSERT INTO tour_itineraries (id, tour_id, day_number, description) VALUES
(400, 40, 1, 'Đón khách, tham quan chợ nổi Cái Răng, vườn trái cây, lưu trú tại Cà Mau'),
(401, 40, 2, 'Tham quan rừng tràm Trà Sư, khu di tích Hồ Thị Kỷ, trả khách');
