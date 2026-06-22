const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const p = await b.newPage();

  await p.goto('http://localhost:3000/login', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  await p.evaluate(() => {
    document.querySelector('#username').value = 'ngocanh@gmail.com';
    document.querySelector('#password').value = '123456';
    document.querySelector('#loginForm button[type="submit"]').click();
  });
  await new Promise(r => setTimeout(r, 5000));

  await p.goto('http://localhost:3000/booking-tour?tour_id=1', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 3000));

  const info = await p.evaluate(() => {
    const name = document.querySelector('#tour-name-display')?.textContent?.trim();
    const total = document.querySelector('#total-amount')?.textContent?.trim();
    return { tourName: name, totalAmount: total };
  });
  console.log('BOOKING FORM:', JSON.stringify(info));

  await b.close();
})();
