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

  // Open first booking detail
  await p.goto('http://localhost:3000/pages/user/booking-details.html?id=96', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 3000));

  const info = await p.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    bodyHTML: document.body.innerHTML.substring(0, 3000),
    detailText: document.body.innerText.substring(0, 1000)
  }));
  console.log('URL:', info.url);
  console.log('TITLE:', info.title);
  console.log('---BODY START---');
  console.log(info.bodyHTML.substring(0, 2500));
  console.log('---DETAIL TEXT---');
  console.log(info.detailText);

  await b.close();
})();
