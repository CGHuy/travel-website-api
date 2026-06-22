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

  const info = await p.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    bodyHTML: document.body.innerHTML.substring(0, 3000),
    links: Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => a.href)
  }));
  console.log('URL:', info.url);
  console.log('TITLE:', info.title);
  console.log('BODY START:', info.bodyHTML.substring(0, 2000));
  
  await b.close();
})();
