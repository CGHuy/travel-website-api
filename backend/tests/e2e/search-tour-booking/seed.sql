-- Seed data cho test TC02: Tìm kiếm tour Đà Nẵng -> Đặt tour -> Kiểm tra thông tin
-- Xóa dữ liệu cũ để đảm bảo test data luôn mới
DELETE FROM tour_itineraries WHERE tour_id IN (10, 11, 12);
DELETE FROM tour_services WHERE tour_id IN (10, 11, 12);
DELETE FROM tour_departures WHERE tour_id IN (10, 11, 12);
DELETE FROM tours WHERE id IN (10, 11, 12);
DELETE FROM users WHERE id = 1;

-- Đảm bảo có tài khoản khách hàng để đặt tour
INSERT INTO users (id, email, password, fullname, phone, role) VALUES
(1, 'ngocanh@gmail.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PQm4sEPhMNPfFhpYN76uO', 'Đỗ Thị Ngọc Anh', '0967123456', 'customer');

-- Tạo tour Đà Nẵng cho test
INSERT INTO tours (id, name, slug, description, price_default, price_child, region, duration, location) VALUES
(10, 'Tour Đà Nẵng 3N2Đ', 'tour-da-nang-3n2d', 'Khám phá Đà Nẵng - Hội An - Bà Nà Hills 3 ngày 2 đêm', 3500000, 2100000, 'Miền Trung', '3 ngày 2 đêm', 'Đà Nẵng, Hội An'),
(11, 'Tour Đà Nẵng - Hội An - Bà Nà Hills 3N2Đ', 'tour-da-nang-hoi-an-ba-na-hills-3n2d', 'Tour Đà Nẵng kết hợp Hội An và Bà Nà Hills', 4500000, 2700000, 'Miền Trung', '3 ngày 2 đêm', 'Đà Nẵng, Hội An, Bà Nà Hills'),
(12, 'Tour Huế - Đà Nẵng 4N3Đ', 'tour-hue-da-nang-4n3d', 'Khám phá Huế và Đà Nẵng', 5500000, 3300000, 'Miền Trung', '4 ngày 3 đêm', 'Huế, Đà Nẵng');

-- Tạo điểm khởi hành cho tour 10
INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES
(100, 10, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Hà Nội', 20, 18, 600000, 400000),
(101, 10, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Hồ Chí Minh', 20, 15, 200000, 100000);

-- Tạo dịch vụ mẫu (dùng IGNORE để không lỗi nếu đã tồn tại)
INSERT IGNORE INTO services (id, name, slug, description) VALUES
(1, 'Khách sạn 4 sao', 'khach-san-4-sao', 'Khách sạn 4 sao với đầy đủ tiện nghi'),
(2, 'Xe đưa đón', 'xe-dua-don', 'Xe du lịch đời mới, máy lạnh, đưa đón khách theo lịch trình'),
(3, 'Hướng dẫn viên', 'huong-dan-vien', 'Hướng dẫn viên chuyên nghiệp, am hiểu tuyến điểm');

-- Gán dịch vụ cho tour 10
INSERT INTO tour_services (tour_id, service_id) VALUES (10, 1), (10, 2), (10, 3);

-- Tạo lịch trình cho tour 10
INSERT INTO tour_itineraries (id, tour_id, day_number, description) VALUES
(100, 10, 1, 'Đón khách tại sân bay, tham quan Bà Nà Hills'),
(101, 10, 2, 'Khám phá phố cổ Hội An, thưởng thức ẩm thực địa phương'),
(102, 10, 3, 'Tham quan bãi biển Mỹ Khê, trả phòng và ra sân bay');
