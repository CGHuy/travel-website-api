const mysql = require('E:\\web_du_lich_api\\travel-website-api\\backend\\node_modules\\mysql2\\promise');
(async () => {
  const conn = await mysql.createConnection({host:'localhost',user:'root',password:'12345',database:'db_viet_tour',port:3306});
  const [tours] = await conn.execute('SELECT id,name FROM tours WHERE id IN (1,3,30)');
  console.log('Tours:', tours.map(t=>`${t.id}: ${t.name}`).join('\n  '));
  const [dep] = await conn.execute('SELECT id,tour_id,departure_date,departure_location,seats_available,status FROM tour_departures WHERE tour_id IN (1,3) ORDER BY tour_id,departure_date');
  console.log('Departures:', JSON.stringify(dep,null,2));
  const [users] = await conn.execute('SELECT id,email,fullname FROM users WHERE email IN ("ngocanh@gmail.com","tuan@gmail.com","thanhtoan@gmail.com")');
  console.log('Users:', JSON.stringify(users,null,2));
  const [cnt] = await conn.execute('SELECT user_id,COUNT(*) cnt FROM bookings GROUP BY user_id');
  console.log('Booking counts:', JSON.stringify(cnt,null,2));
  await conn.end();
})();
