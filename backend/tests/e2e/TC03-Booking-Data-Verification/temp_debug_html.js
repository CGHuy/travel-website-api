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

  await p.goto('http://localhost:3000/pages/user/bookings-history.html', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 3000));

  const html = await p.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const bookingSection = main.querySelector('[class*="booking"], #bookings-table, .table');
    return bookingSection ? bookingSection.innerHTML.substring(0, 2000) : main.innerHTML.substring(0, 2000);
  });
  console.log('HTML:', html.substring(0, 2000));
  
  await b.close();
})();
