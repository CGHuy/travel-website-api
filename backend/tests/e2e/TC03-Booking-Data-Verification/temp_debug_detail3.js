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

  await p.goto('http://localhost:3000/pages/user/booking-details.html?id=96', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 3000));

  // Find the tour name element in the Thông tin Tour section
  const tourInfo = await p.evaluate(() => {
    const card = document.querySelector('.premium-card');
    if (!card) return { error: 'no premium-card' };
    const header = card.querySelector('.premium-card-header h3');
    const body = card.querySelector('.premium-card-body');
    // Get all headings in the body
    const headings = body ? Array.from(body.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({ tag: h.tagName, text: h.textContent.trim() })) : [];
    return {
      headerText: header?.textContent,
      bodyHTML: body?.innerHTML?.substring(0, 800),
      headings
    };
  });
  console.log('TOUR INFO:', JSON.stringify(tourInfo, null, 2));

  // Also get the id for tour name
  const ids = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('[id]')).map(el => el.id);
  });
  console.log('ALL IDS:', JSON.stringify(ids));

  await b.close();
})();
