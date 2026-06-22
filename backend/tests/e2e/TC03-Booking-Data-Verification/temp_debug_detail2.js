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

  // Get HTML containing "Thông tin Tour" section and payment section
  const sections = await p.evaluate(() => {
    const allDivs = document.querySelectorAll('div, section');
    const result = [];
    for (const d of allDivs) {
      const text = d.textContent.trim().substring(0, 60);
      if (text.includes('Thông tin Tour') || text.includes('Chi tiết thanh toán') || text.includes('Mã đơn') || text.includes('Tổng cộng')) {
        result.push({
          id: d.id,
          className: d.className,
          innerHTML: d.outerHTML.substring(0, 600)
        });
      }
    }
    return result;
  });
  console.log('SECTIONS:\n', JSON.stringify(sections, null, 2));

  // Also get the payment summary elements
  const paymentInfo = await p.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim());
    // Find lines around "Tổng cộng"
    const totalIdx = lines.findIndex(l => l.includes('Tổng cộng'));
    return lines.slice(Math.max(0, totalIdx - 5), totalIdx + 3);
  });
  console.log('PAYMENT LINES:', JSON.stringify(paymentInfo));

  await b.close();
})();
