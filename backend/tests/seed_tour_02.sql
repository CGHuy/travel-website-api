-- Xóa tour test từ TC01 nếu còn sót
-- Phải xóa child tables trước do FK constraints
SELECT @tid := id FROM tours WHERE slug = 'tour-cu-chi-test';

DELETE FROM passengers WHERE booking_id IN (SELECT id FROM bookings WHERE departure_id IN (SELECT id FROM tour_departures WHERE tour_id = @tid));
DELETE FROM reviews WHERE booking_id IN (SELECT id FROM bookings WHERE departure_id IN (SELECT id FROM tour_departures WHERE tour_id = @tid));
DELETE FROM reviews WHERE tour_id = @tid;
DELETE FROM bookings WHERE departure_id IN (SELECT id FROM tour_departures WHERE tour_id = @tid);
DELETE FROM tour_departures WHERE tour_id = @tid;
DELETE FROM tour_images WHERE tour_id = @tid;
DELETE FROM tour_itineraries WHERE tour_id = @tid;
DELETE FROM tour_services WHERE tour_id = @tid;
DELETE FROM wishlist WHERE tour_id = @tid;
DELETE FROM tours WHERE id = @tid;
