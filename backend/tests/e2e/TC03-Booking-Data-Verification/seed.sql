DELETE FROM tour_departures WHERE id = 99;
INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES
(99, 1, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Hồ Chí Minh', 30, 25, 500000, 300000);
