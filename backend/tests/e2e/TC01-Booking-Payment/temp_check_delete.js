const mysql = require('E:\\web_du_lich_api\\travel-website-api\\backend\\node_modules\\mysql2\\promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'12345',database:'db_viet_tour',port:3306});
  
  // Read and parse seed
  const fs = require('fs');
  const seedSql = fs.readFileSync('E:\\web_du_lich_api\\travel-website-api\\backend\\tests\\e2e\\TC01-Booking-Payment\\seed.sql', 'utf-8');
  const statements = seedSql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));
  
  console.log('Statements:');
  statements.forEach((s, i) => console.log(`  ${i}: ${s.substring(0, 80)}`));
  
  console.log('\n=== RUNNING SEED ===');
  for (const stmt of statements) {
    try {
      const [r] = await c.query(stmt);
      if (r && r.affectedRows !== undefined) console.log(`  OK: ${stmt.substring(0, 60)} -> ${r.affectedRows} rows`);
      else console.log(`  OK: ${stmt.substring(0, 60)}`);
    } catch (err) {
      console.log(`  ERR: ${stmt.substring(0, 60)} -> ${err.message.substring(0, 80)}`);
    }
  }
  
  const [cnt] = await c.execute("SELECT user_id, COUNT(*) cnt FROM bookings GROUP BY user_id");
  console.log('\nBookings after seed:', JSON.stringify(cnt, null, 2));
  
  await c.end();
})();
