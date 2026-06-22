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
  const token = await p.evaluate(() => localStorage.getItem('token'));
  if (!token) { console.log('LOGIN FAILED'); await b.close(); return; }

  await p.goto('http://localhost:3000/pages/user/bookings-history.html', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 3000));

  // Get full HTML of the first 3 rows
  const rows = await p.evaluate(() => {
    const r = document.querySelectorAll('#bookings-table tbody tr, .booking-item, table tbody tr');
    if (!r.length) return 'NO ROWS';
    const firstRow = r[0];
    // Get all inner text from row
    const cells = firstRow.querySelectorAll('td, th');
    return Array.from(cells).map((c, i) => ({
      index: i,
      text: c.textContent.trim().substring(0, 100),
      html: c.innerHTML.trim().substring(0, 150),
      class: c.className
    }));
  });
  console.log('ROW CELLS:\n', JSON.stringify(rows, null, 2));
  
  // Also get the page URL and check for detail links
  const links = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim().substring(0, 80)
    })).filter(a => a.href && a.href.includes('detail'));
  });
  console.log('DETAIL LINKS:\n', JSON.stringify(links, null, 2));
  
  await b.close();
})();
