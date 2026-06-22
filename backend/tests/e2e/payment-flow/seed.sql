DELETE FROM tour_itineraries WHERE tour_id IN (30);
DELETE FROM tour_services WHERE tour_id IN (30);
DELETE FROM tour_departures WHERE tour_id IN (30);
DELETE FROM tours WHERE id IN (30);
DELETE FROM users WHERE id = 3;

INSERT INTO users (id, email, password, fullname, phone, role) VALUES
(3, 'thanhtoan@gmail.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PQm4sEPhMNPfFhpYN76uO', 'Nguyễn Thanh Toán', '0909123456', 'customer');

INSERT INTO tours (id, name, slug, description, price_default, price_child, region, duration, location) VALUES
(30, 'Tour Nha Trang 4N3Đ', 'tour-nha-trang-4n3d', 'Khám phá Nha Trang - VinWonders - Lặn biển 4 ngày 3 đêm', 5500000, 3300000, 'Miền Trung', '4 ngày 3 đêm', 'Nha Trang, Khánh Hòa');

INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES
(300, 30, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Hà Nội', 30, 25, 500000, 300000),
(301, 30, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Hồ Chí Minh', 30, 22, 700000, 400000);

INSERT IGNORE INTO services (id, name, slug, description) VALUES
(6, 'Khách sạn resort', 'khach-san-resort', 'Resort tiêu chuẩn 5 sao với đầy đủ tiện nghi'),
(7, 'Xe đưa đón', 'xe-dua-don', 'Xe du lịch đời mới, máy lạnh, đưa đón khách theo lịch trình');

INSERT INTO tour_services (tour_id, service_id) VALUES (30, 6), (30, 7);

INSERT INTO tour_itineraries (id, tour_id, day_number, description) VALUES
(300, 30, 1, 'Đón khách, tham quan Tháp Bà Ponagar'),
(301, 30, 2, 'Vui chơi tại VinWonders Nha Trang, lặn ngắm san hô'),
(302, 30, 3, 'Tham quan Hòn Mun, Hòn Tằm, tắm bùn khoáng nóng'),
(303, 30, 4, 'Mua sắm đặc sản tại Chợ Đầm, ra sân bay');
