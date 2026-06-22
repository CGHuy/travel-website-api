const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  const p = await b.newPage();

  // Listen for console messages
  p.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Booking') || msg.text().includes('Error')) {
      console.log('  [PAGE]', msg.text());
    }
  });

  // Listen for requests
  p.on('response', resp => {
    const url = resp.url();
    if (url.includes('create-payment') || url.includes('bookings')) {
      console.log('  [NET]', resp.status(), url.substring(0, 100));
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

  // Check button state before filling
  const btnDisabled = await p.evaluate(() => document.getElementById('submitBooking')?.disabled);
  console.log('Submit button disabled:', btnDisabled);

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

  // Check form validity
  const formValid = await p.evaluate(() => {
    const form = document.getElementById('booking-form');
    return form.checkValidity();
  });
  console.log('Form valid:', formValid);

  if (!formValid) {
    // Check which fields are invalid
    const invalidFields = await p.evaluate(() => {
      const form = document.getElementById('booking-form');
      const els = Array.from(form.querySelectorAll('[required]'));
      return els.map(el => ({
        id: el.id,
        name: el.name,
        type: el.type,
        value: el.value,
        valid: el.checkValidity(),
        validationMessage: el.validationMessage
      }));
    });
    console.log('Invalid fields:', JSON.stringify(invalidFields.filter(f => !f.valid), null, 2));
  }

  // Check hidden input value
  const dobVal = await p.evaluate(() => document.getElementById('contact_dob')?.value);
  console.log('contact_dob value:', dobVal);

  await b.close();
})();
