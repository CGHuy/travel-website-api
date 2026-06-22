const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host:'localhost',user:'root',password:'12345',database:'db_viet_tour',port:3306});
  const [tours] = await conn.execute('SELECT id,name FROM tours WHERE id=30');
  console.log('Tour 30:', tours.length>0 ? tours[0].name : 'NOT FOUND');
  const [dep] = await conn.execute('SELECT id,departure_date,price_moving,price_moving_child,seats_available FROM tour_departures WHERE tour_id=30');
  console.log('Departures for tour 30:', JSON.stringify(dep));
  const [users] = await conn.execute('SELECT id,email,fullname,role FROM users WHERE email="ngocanh@gmail.com"');
  console.log('User ngocanh:', JSON.stringify(users[0]));
  await conn.end();
})();
