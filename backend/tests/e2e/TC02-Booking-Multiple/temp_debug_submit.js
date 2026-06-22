const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const p = await b.newPage();
  p.on('console', msg => console.log('PAGE:', msg.text()));
  p.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  // Login
  await p.goto('http://localhost:3000/login', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  await p.evaluate(() => {
    document.querySelector('#username').value = 'thanhtoan@gmail.com';
    document.querySelector('#password').value = '123456';
    document.querySelector('#loginForm button[type="submit"]').click();
  });
  await new Promise(r => setTimeout(r, 5000));
  const token = await p.evaluate(() => localStorage.getItem('token'));
  if (!token) { console.log('LOGIN FAILED - no token'); await b.close(); return; }
  console.log('LOGGED IN, token:', token.substring(0, 20) + '...');

  await p.goto('http://localhost:3000/booking-tour?tour_id=2', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 8000));

  // Check user role
  const role = await p.evaluate(() => {
    const user = localStorage.getItem('user');
    if (!user) return 'no user in LS';
    try { return JSON.parse(user).role; } catch(e) { return 'parse error'; }
  });
  console.log('USER_ROLE from LS:', role);

  // Fill form
  await p.evaluate(() => {
    document.getElementById('contact_name').value = 'Nguyễn Văn Test';
    document.getElementById('contact_phone').value = '0987654321';
    document.getElementById('contact_email').value = 'thanhtoan@gmail.com';
    const dob = document.getElementById('contact_dob');
    if (dob) dob.value = '1995-08-25';
    const gender = document.getElementById('contact_gender');
    if (gender) gender.value = 'Nam';
  });

  // Select departure
  const opts = await p.$$('#departure_id option');
  for (const o of opts) {
    const v = await p.evaluate(el => el.value, o);
    if (v) {
      await p.select('#departure_id', v);
      console.log('Selected:', await p.evaluate(el => el.textContent, o));
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  // Check submit button status
  const btnStatus = await p.evaluate(() => {
    const btn = document.getElementById('submitBooking');
    if (!btn) return 'NO BTN';
    return { disabled: btn.disabled, text: btn.textContent.trim() };
  });
  console.log('BTN_STATUS:', JSON.stringify(btnStatus));

  // Click submit and monitor
  console.log('=== CLICKING SUBMIT ===');
  await p.evaluate(() => document.getElementById('submitBooking').click());
  
  // Watch for network activity
  p.on('request', r => {
    if (r.method() === 'POST') console.log('POST:', r.url().substring(0, 100));
  });
  p.on('response', r => {
    if (r.url().includes('booking') || r.url().includes('payment') || r.url().includes('vnpay'))
      console.log('RESP:', r.status(), r.url().substring(0, 100));
  });

  let found = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const url = p.url();
    console.log('URL at ' + ((i+1)*2) + 's:', url.substring(0, 100));
    if (url.includes('sandbox') || url.includes('vnpay')) { found = true; break; }
  }
  if (!found) console.log('NO VNPAY REDIRECT');

  await b.close();
})();
