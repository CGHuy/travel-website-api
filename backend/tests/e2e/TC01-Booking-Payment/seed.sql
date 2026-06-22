DELETE FROM bookings WHERE user_id IN (5, 3);
UPDATE tour_departures SET departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY), seats_available = 25, status = 'open' WHERE id = 5 AND tour_id = 3;
UPDATE tour_departures SET departure_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY), seats_available = 22, status = 'open' WHERE id = 6 AND tour_id = 3;
UPDATE tour_departures SET departure_date = DATE_ADD(CURDATE(), INTERVAL 21 DAY), seats_available = 20, status = 'open' WHERE id = 41 AND tour_id = 3;
DELETE FROM users WHERE id = 3;
INSERT INTO users (id, email, password, fullname, phone, role) VALUES (3, 'thanhtoan@gmail.com', '$2b$10$RJ6mrgfm/0oYHBLI5mUKvezjE424772XxEyv2Z.dLEECytM.SppeK', 'Nguyễn Thanh Toán', '0909123456', 'customer');
