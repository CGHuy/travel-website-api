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

  const allDivs = await p.evaluate(() => {
    const divs = document.querySelectorAll('div, section, main');
    const result = [];
    for (const d of divs) {
      const text = d.textContent.trim().substring(0, 50);
      const id = d.id;
      const cls = d.className;
      if (text.includes('Tour') || text.includes('booking') || text.includes('Booking') || text.includes('Đà Lạt') || text.includes('chi tiết') || text.includes('Chi tiết')) {
        result.push({ id, class: cls, text: text.substring(0, 80), childCount: d.children.length });
      }
    }
    return result.slice(0, 20);
  });
  console.log('MATCHING DIVS:', JSON.stringify(allDivs, null, 2));

  // Get the main content area
  const mainHTML = await p.evaluate(() => {
    const main = document.querySelector('main') || document.getElementById('main-content');
    return main ? main.innerHTML.substring(0, 2000) : 'NO MAIN found';
  });
  console.log('MAIN HTML:', mainHTML.substring(0, 1500));

  await b.close();
})();
