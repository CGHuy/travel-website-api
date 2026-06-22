const mysql = require('E:\\web_du_lich_api\\travel-website-api\\backend\\node_modules\\mysql2\\promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'12345',database:'db_viet_tour',port:3306});
  const [tour] = await c.execute("SELECT * FROM tours WHERE id = 3");
  console.log('Tour 3 details:', JSON.stringify(tour, null, 2));
  const [imgs] = await c.execute("SELECT * FROM tour_images WHERE tour_id = 3");
  console.log('Images:', JSON.stringify(imgs, null, 2));
  const [dep3] = await c.execute("SELECT * FROM tour_departures WHERE tour_id = 3");
  console.log('Departures for tour 3:', JSON.stringify(dep3, null, 2));
  await c.end();
})();
