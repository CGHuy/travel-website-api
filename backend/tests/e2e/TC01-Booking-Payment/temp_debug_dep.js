const mysql = require('E:\\web_du_lich_api\\travel-website-api\\backend\\node_modules\\mysql2\\promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'12345',database:'db_viet_tour',port:3306});
  
  // Step by step
  const steps = [
    'DELETE FROM bookings WHERE departure_id IN (SELECT id FROM tour_departures WHERE tour_id = 1)',
    'DELETE FROM bookings WHERE departure_id IS NULL',
    'DELETE FROM tour_itineraries WHERE tour_id = 1',
    'DELETE FROM tour_services WHERE tour_id = 1',
    'DELETE FROM tour_images WHERE tour_id = 1',
    'DELETE FROM reviews WHERE tour_id = 1',
    'DELETE FROM tour_departures WHERE tour_id = 1',
    'DELETE FROM tours WHERE id = 1',
    "INSERT INTO tours (id, name, slug, description, price_default, price_child, region, duration, location, cover_image) VALUES (1, 'Tour Đà Lạt 3N2Đ', 'tour-da-lat', 'Khám phá Đà Lạt 3 ngày 2 đêm', 3200000, 2200000, 'Miền Nam', '3 ngày 2 đêm', 'Đà Lạt, Lâm Đồng', 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281041/travel-website/dalat.jpg')",
    "INSERT INTO tour_images (tour_id, image) VALUES (1, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281041/travel-website/dalat.jpg')",
    "INSERT INTO tour_departures (id, tour_id, departure_date, departure_location, seats_total, seats_available, price_moving, price_moving_child) VALUES (1, 1, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Hà Nội', 30, 25, 800000, 500000)",
  ];
  
  for (const stmt of steps) {
    try {
      const [r] = await c.execute(stmt);
      console.log('OK:', stmt.substring(0, 60), '-> affected:', r.affectedRows);
    } catch (err) {
      console.log('ERR:', stmt.substring(0, 60), '->', err.message.substring(0, 150));
    }
  }

  const [tours] = await c.execute('SELECT id, name FROM tours WHERE id = 1');
  console.log('Tours after:', JSON.stringify(tours));
  const [deps] = await c.execute('SELECT id FROM tour_departures WHERE tour_id = 1');
  console.log('Departures after:', JSON.stringify(deps));
  const [imgs] = await c.execute('SELECT * FROM tour_images WHERE tour_id = 1');
  console.log('Images after:', JSON.stringify(imgs));
  await c.end();
})();
