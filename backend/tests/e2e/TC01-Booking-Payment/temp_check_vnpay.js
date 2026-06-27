const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  const p = await b.newPage();

  // Login first
  await p.goto('http://localhost:3000/login', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  await p.evaluate(() => {
    document.querySelector('#username').value = 'ngocanh@gmail.com';
    document.querySelector('#password').value = '123456';
    document.querySelector('#loginForm button[type="submit"]').click();
  });
  await new Promise(r => setTimeout(r, 5000));

  // Book tour
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
    const opt = Array.from(sel.options).find(o => o.value);
    if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', {bubbles:true})); }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click submit and wait for VNPay
  await p.evaluate(() => document.getElementById('submitBooking').click());
  await new Promise(r => setTimeout(r, 8000));

  // Check if on VNPay
  const url = p.url();
  if (url.includes('sandbox.vnpayment.vn')) {
    console.log('ON VNPay page');
    // Wait a bit for the page to fully load
    await new Promise(r => setTimeout(r, 3000));

    // Get all form elements
    const forms = await p.evaluate(() => {
      const all = document.querySelectorAll('input, select, button, iframe');
      return Array.from(all).map(el => ({
        tag: el.tagName,
        id: el.id,
        name: el.name,
        type: el.type,
        className: el.className?.substring(0, 60),
        placeholder: el.placeholder,
        src: el.src?.substring(0, 80)
      }));
    });
    console.log('Form elements:', JSON.stringify(forms, null, 2));

    // Also get page text
    const text = await p.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('PAGE TEXT:', text);

    // Check for iframes
    const iframes = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => f.src);
    });
    console.log('IFRAMES:', JSON.stringify(iframes));
  } else {
    console.log('NOT on VNPay, URL:', url);
  }

  await b.close();
})();
