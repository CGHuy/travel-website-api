const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  const p = await b.newPage();

  let apiResponseData = null;

  // Intercept responses for the booking API
  p.on('response', async resp => {
    const url = resp.url();
    if (url.includes('create-payment-url')) {
      console.log('  [API] Status:', resp.status());
      try {
        const json = await resp.json();
        apiResponseData = json;
        console.log('  [API] Response:', JSON.stringify(json).substring(0, 300));
      } catch (e) {
        console.log('  [API] Raw:', await resp.text().then(t => t.substring(0, 200)));
      }
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

  // Fill form
  await p.evaluate(() => {
    document.getElementById('contact_name').value = 'Đỗ Thị Ngọc Anh';
    document.getElementById('contact_phone').value = '0967123456';
    document.getElementById('contact_email').value = 'ngocanh@gmail.com';
    const dob = document.getElementById('contact_dob');
    if (dob && dob._flatpickr) dob._flatpickr.setDate('1995-08-25');
    document.getElementById('contact_gender').value = 'Nữ';
  });

  // Select departure
  await p.evaluate(() => {
    const sel = document.getElementById('departure_id');
    const validOpt = Array.from(sel.options).find(o => o.value);
    if (validOpt) {
      sel.value = validOpt.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Double check form valid
  const formValid = await p.evaluate(() => document.getElementById('booking-form').checkValidity());
  console.log('Form valid:', formValid);

  // Click submit
  console.log('Clicking submit...');
  await p.evaluate(() => document.getElementById('submitBooking').click());

  // Wait for response
  await new Promise(r => setTimeout(r, 5000));

  if (apiResponseData) {
    console.log('API response:', JSON.stringify(apiResponseData).substring(0, 500));
  } else {
    console.log('No API response captured');
  }

  console.log('Current URL:', p.url().substring(0, 100));

  await b.close();
})();
