const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "TC01-add");
const URL = "http://localhost:3000";
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ trước khi chạy
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();
  let step = 0;
  const shot = async (name) => {
    step++;
    try {
      await page.screenshot({
        path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
        fullPage: true,
      });
      console.log(`  >> Đã chụp: ${name}.png`);
    } catch (e) {
      await sleep(2000);
      await page.screenshot({
        path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
        fullPage: true,
      });
      console.log(`  >> Đã chụp (lần 2): ${name}.png`);
    }
  };

  try {
    // TODO: Viết test case cho kịch bản WISHLIST
    // VD: Đăng nhập → Tìm tour → Tim/Yêu thích → Kiểm tra danh sách yêu thích
    console.log("Chưa có nội dung test case wishlist");
    await shot("01-placeholder");
  } catch (err) {
    console.error(`\n❌ LỖI: ${err.message}`);
    try {
      await page.screenshot({
        path: path.join(DIR, "error.png"),
        fullPage: true,
      });
    } catch (e) {}
  } finally {
    try {
      await browser.close();
    } catch (e) {}
    console.log("Đã đóng trình duyệt");
  }
})();
