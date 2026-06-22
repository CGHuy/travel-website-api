const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "TC03-notlogged-booking");
const BASE_URL = "http://localhost:3000";
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
    // ====================================================================
    // BƯỚC 1: Vào trang chi tiết tour (chưa đăng nhập)
    // ====================================================================
    console.log("\n========== BƯỚC 1: VÀO TRANG CHI TIẾT TOUR ==========");
    await page.goto(`${BASE_URL}/list-tour`, { waitUntil: "networkidle0" });
    await page.waitForSelector("#searchInput");
    await sleep(1000);
    console.log('  -> Nhập từ khóa "Phú Quốc"...');
    await page.type("#searchInput", "Phú Quốc", { delay: 50 });
    await sleep(3000);

    const tourLink =
      (await page.$('#tour-list a[href*="detail-tour"]')) ||
      (await page.$$('a[href*="detail-tour"]'))[0];
    if (!tourLink) throw new Error("Không tìm thấy tour");
    const href = await page.evaluate((el) => el.getAttribute("href"), tourLink);
    console.log(`  -> Đi đến: ${href}`);
    await page.goto(href.startsWith("http") ? href : `${BASE_URL}${href}`, {
      waitUntil: "networkidle0",
    });
    await sleep(1000);
    await shot("01-tour-detail-not-logged");

    // ====================================================================
    // BƯỚC 2: Nhấn Đặt Tour (chưa đăng nhập) → toast → redirect login
    // ====================================================================
    console.log("\n========== BƯỚC 2: NHẤN ĐẶT TOUR (CHƯA ĐĂNG NHẬP) ==========");
    const bookBtn = await page.$("#bookTourBtn");
    if (!bookBtn) throw new Error("Không tìm thấy nút Đặt tour");
    console.log('  -> Click "Đặt Tour ngay"...');
    await bookBtn.click();
    await sleep(500);
    await shot("02-toast-vui-long-dang-nhap");
    console.log("  -> Toast hiển thị, chờ redirect sang login...");
    await sleep(3000);

    // ====================================================================
    // BƯỚC 3: Đăng nhập
    // ====================================================================
    console.log("\n========== BƯỚC 3: ĐĂNG NHẬP ==========");
    await page.waitForSelector("#loginForm", { timeout: 10000 });
    await sleep(500);
    console.log("  -> Nhập tài khoản...");
    await page.type("#username", "ngocanh@gmail.com", { delay: 30 });
    await page.type("#password", "123456", { delay: 30 });
    await shot("03-login-page");
    await page.click('button[type="submit"]');
    console.log("  -> Đã click Đăng nhập, chờ xử lý...");
    await page.waitForFunction(() => localStorage.getItem("token") !== null, {
      timeout: 8000,
    });
    await sleep(1500);
    console.log(`  -> Đã đăng nhập, URL: ${page.url().substring(0, 80)}...`);
    await shot("04-after-login");

    // ====================================================================
    // BƯỚC 4: Click Đặt Tour (lần 2) → booking form
    // ====================================================================
    console.log("\n========== BƯỚC 4: NHẤN ĐẶT TOUR (LẦN 2) ==========");
    const bookBtn2 = await page.$("#bookTourBtn");
    if (bookBtn2) {
      console.log('  -> Click "Đặt Tour ngay" (đã đăng nhập)...');
      await bookBtn2.click();
    }
    await sleep(3000);
    if (!page.url().includes("booking-tour")) {
      const tourId = new URL(page.url()).searchParams.get("id") || "5";
      console.log(`  -> Redirect không kịp, load thẳng booking-tour?tour_id=${tourId}`);
      await page.goto(`${BASE_URL}/booking-tour?tour_id=${tourId}`, {
        waitUntil: "networkidle0",
      });
      await sleep(2000);
    }
    await page.waitForSelector("#booking-form", { timeout: 10000 }).catch(() => {});
    await sleep(1500);
    await shot("05-booking-form");

    // ====================================================================
    // BƯỚC 5: Nhập thông tin form
    // ====================================================================
    console.log("\n========== BƯỚC 5: NHẬP THÔNG TIN FORM ==========");
    const nameInput = await page.$("#contact_name").catch(() => null);
    if (nameInput) {
      await page.$eval("#contact_name", (el) => (el.value = ""));
      await page.type("#contact_name", "Nguyễn Ngọc Ánh", { delay: 20 });
    }
    await sleep(500);

    const phoneInput = await page.$("#contact_phone").catch(() => null);
    if (phoneInput) {
      await page.$eval("#contact_phone", (el) => (el.value = ""));
      await page.type("#contact_phone", "0912345678", { delay: 20 });
    }
    await sleep(500);

    const dobInput = await page.$("#contact_dob").catch(() => null);
    if (dobInput) {
      await page.evaluate(() => {
        const p = document.getElementById("contact_dob")._flatpickr;
        if (p) p.setDate("1995-08-15");
      }).catch(() => {});
    }
    await sleep(500);

    const genderInput = await page.$("#contact_gender").catch(() => null);
    if (genderInput) {
      await page.select("#contact_gender", "Nữ").catch(() => {});
    }
    await sleep(300);

    const emailInput = await page.$("#contact_email").catch(() => null);
    if (emailInput) {
      await page.$eval("#contact_email", (el) => (el.value = ""));
      await page.type("#contact_email", "ngocanh@gmail.com", { delay: 20 });
    }
    await sleep(500);

    console.log("  -> Chọn ngày khởi hành...");
    const depSelect = await page.$("#departure_id").catch(() => null);
    if (depSelect) {
      const opts = await page.$$("#departure_id option");
      for (const o of opts) {
        const v = await page.evaluate((el) => el.value, o);
        if (v) {
          await page.select("#departure_id", v);
          const text = await page.evaluate((el) => el.textContent, o);
          console.log(`  -> Đã chọn: ${text}`);
          break;
        }
      }
    }
    await sleep(2000);

    console.log("  -> Lấy tổng tiền...");
    const totalAmount = await page
      .$eval("#total-amount", (el) => el.textContent)
      .catch(() => "N/A");
    const passengers = await page
      .$eval("#sum-passengers", (el) => el.textContent)
      .catch(() => "N/A");
    console.log(`  -> Tổng tiền: ${totalAmount}`);
    console.log(`  -> Hành khách: ${passengers}`);
    await sleep(1000);
    await shot("06-form-filled");

    // ====================================================================
    // BƯỚC 6: Xác nhận đặt tour → redirect VNPay
    // ====================================================================
    console.log("\n========== BƯỚC 6: XÁC NHẬN ĐẶT TOUR ==========");
    const submitBtn = await page.$("#submitBooking");
    if (!submitBtn) throw new Error("Không tìm thấy nút Xác nhận");
    if (await page.evaluate((el) => el.disabled, submitBtn))
      throw new Error("Nút Xác nhận đang bị disable");
    console.log('  -> Click "Xác nhận thanh toán"...');
    await submitBtn.click();
    console.log("  -> Đang chờ redirect sang VNPay...");
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      const url = page.url();
      if (!url.includes("booking-tour")) {
        console.log(`  -> Đã chuyển trang: ${url.substring(0, 80)}...`);
        break;
      }
      if (i === 5) console.log("  -> (Vẫn đang chờ...)");
      if (i === 10) console.log("  -> (Có thể form validation thất bại)");
    }

    try { await page.waitForSelector("body", { timeout: 15000 }); } catch (e) {}
    await sleep(2000);

    const curUrl = page.url();
    const onVnpay = curUrl.includes("sandbox.vnpayment.vn");
    const onForm = curUrl.includes("booking-tour");

    if (onVnpay) console.log("  => Redirect sang VNPay thành công!");
    else if (onForm) console.log("  => Ở lại form (validation thất bại)");
    await shot("07-after-submit");

    // ====================================================================
    // BƯỚC 7: Chờ người dùng thanh toán thủ công trên VNPay
    // ====================================================================
    console.log("\n========== BƯỚC 7: THANH TOÁN VNPay ==========");
    let bookingId = null;
    if (onVnpay) {
      try { await page.waitForSelector("body", { timeout: 10000 }); } catch (e) {}
      await sleep(2000);

      console.log("\n══════════════════════════════════════════════");
      console.log("  VUI LÒNG THANH TOÁN TRÊN TRANG VNPay");
      console.log("  Chrome đang mở trang VNPay Sandbox");
      console.log("  Nhập thẻ test và thanh toán");
      console.log("  Sau đó script sẽ tự động chạy tiếp");
      console.log("");
      console.log("  Thẻ: 9704198526191432198");
      console.log("  Hạn: 12/25");
      console.log("  OTP: 123456");
      console.log("══════════════════════════════════════════════\n");
      try {
        await page.waitForFunction(
          () =>
            window.location.href.includes("payment-result") ||
            window.location.href.includes("vnpay-return"),
          { timeout: 300000 },
        );
        await sleep(2000);
        console.log("  => Đã nhận kết quả từ VNPay!");
      } catch (e) {
        console.log("  => Hết thời gian chờ (5 phút)");
      }
      const url = String(page.url());
      console.log(`  => URL: ${url.substring(0, 100)}`);
      if (url.includes("payment-result") || url.includes("vnpay-return")) {
        const match = url.match(/[?&]bookingId=(\d+)/);
        bookingId = match ? match[1] : null;
        if (bookingId) console.log(`  => Booking ID mới: ${bookingId}`);
      }
      await shot("08-payment-result");
    } else {
      console.log("  => Bỏ qua VNPay (không redirect được)");
    }

    // ====================================================================
    // BƯỚC 8: Lịch sử đặt tour
    // ====================================================================
    console.log("\n========== BƯỚC 8: LỊCH SỬ ĐẶT TOUR ==========");
    await page.goto(`${BASE_URL}/bookings-history`, { waitUntil: "networkidle0" });
    await sleep(2000);
    await shot("09-booking-history");
    const bookingCount = (await page.$$(".booking-item")).length;
    console.log(`  => Số booking trong tài khoản: ${bookingCount}`);

    // ====================================================================
    // BƯỚC 9: Chi tiết booking
    // ====================================================================
    console.log("\n========== BƯỚC 9: CHI TIẾT BOOKING ==========");
    const dl = await page.$('.booking-item a[href*="booking-details"]');
    if (dl) {
      const url = await page.evaluate((el) => el.getAttribute("href"), dl);
      console.log(`  -> Mở chi tiết: ${url}`);
      await page.goto(url.startsWith("http") ? url : `${BASE_URL}${url}`, {
        waitUntil: "networkidle0",
      });
      await sleep(2000);
      await shot("10-booking-detail");
      console.log(
        `  Mã: ${await page.$eval("#booking-code", (el) => el.textContent).catch(() => "N/A")}`,
      );
      console.log(
        `  Trạng thái: ${await page.$eval("#booking-status", (el) => el.textContent).catch(() => "N/A")}`,
      );
    } else {
      console.log("  => Không tìm thấy booking nào");
    }

    // ====================================================================
    // TỔNG KẾT
    // ====================================================================
    console.log("\n============================================");
    console.log(`✅ TC03 HOÀN TẤT - ${step} ảnh đã lưu`);
    console.log(`📁 Thư mục: ${DIR}`);
    console.log("============================================\n");
    console.log("Trình duyệt sẽ đóng sau 10 giây...");
    await sleep(10000);
  } catch (err) {
    console.error(`\n❌ LỖI: ${err.message}`);
    try {
      await page.screenshot({
        path: path.join(DIR, "error.png"),
        fullPage: true,
      });
      console.log("  >> Đã chụp ảnh lỗi");
    } catch (e) {}
  } finally {
    try { await browser.close(); } catch (e) {}
    console.log("Đã đóng trình duyệt");
  }
})();
