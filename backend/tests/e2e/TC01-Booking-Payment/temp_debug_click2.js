const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  const p = await b.newPage();

  p.on('response', async resp => {
    const url = resp.url();
    if (url.includes('create-payment-url') || url.includes('bookings')) {
      const method = resp.request().method();
      if (method === 'POST') {
        console.log('  [API POST] Status:', resp.status());
        try {
          const text = await resp.text();
          console.log('  [API POST] Body:', text.substring(0, 500));
        } catch (e) {
          console.log('  [API POST] Error reading body:', e.message.substring(0, 100));
        }
      } else {
        console.log('  [API', method, '] Status:', resp.status());
      }
    }
  });

  p.on('console', msg => {
    if (msg.text().includes('Booking') || msg.text().includes('Error') || msg.text().includes('vnpay') || msg.text().includes('error')) {
      console.log('  [PAGE]', msg.text());
    }
  });

  await p.goto('http://localhost:3000/login', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  await p.evaluate(() => {
    document.querySelector('#username').value = 'ngocanh@gmail.com';
    document.querySelector('#password').value = '123456';
    document.querySelector('#loginForm button[type="submit"]').click();
  });
  await new Promise(r => setTimeout(r, 5000));

  await p.goto('http://localhost:3000/booking-tour?tour_id=1', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 6000));

  await p.evaluate(() => {
    document.getElementById('contact_name').value = 'Đỗ Thị Ngọc Anh';
    document.getElementById('contact_phone').value = '0967123456';
    document.getElementById('contact_email').value = 'ngocanh@gmail.com';
    const dob = document.getElementById('contact_dob');
    if (dob && dob._flatpickr) dob._flatpickr.setDate('1995-08-25');
    document.getElementById('contact_gender').value = 'Nữ';
  });

  await p.evaluate(() => {
    const sel = document.getElementById('departure_id');
    const validOpt = Array.from(sel.options).find(o => o.value);
    if (validOpt) { sel.value = validOpt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking submit...');
  await p.evaluate(() => document.getElementById('submitBooking').click());
  await new Promise(r => setTimeout(r, 10000));

  console.log('Current URL:', p.url().substring(0, 120));
  await b.close();
})();
