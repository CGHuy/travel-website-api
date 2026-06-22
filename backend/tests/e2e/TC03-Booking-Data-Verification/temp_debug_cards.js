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

  const cards = await p.evaluate(() => {
    const cards = document.querySelectorAll('.booking-card');
    return Array.from(cards).slice(0, 3).map(card => ({
      fullHTML: card.outerHTML.substring(0, 1000),
      bookingInfoHTML: card.querySelector('.booking-info')?.innerHTML?.substring(0, 800) || 'no info',
      infoRows: Array.from(card.querySelectorAll('.info-row')).map(r => r.textContent.trim().replace(/\s+/g, ' ').substring(0, 100))
    }));
  });
  console.log('CARDS:\n', JSON.stringify(cards, null, 2));
  
  await b.close();
})();
