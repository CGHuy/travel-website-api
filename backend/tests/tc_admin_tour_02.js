const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_TOUR_02";
const TEST_NAME = TEST_CASE + " - Thêm tour thất bại do thiếu tên tour";
const LOG_DIR = path.join(__dirname, "..", "test-results", "logs");
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-results", "screenshots", TEST_CASE);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    ensureDir(LOG_DIR);
    fs.appendFileSync(path.join(LOG_DIR, "test-result.log"), line);
    console.log(msg);
}

function shotPath(name) {
    ensureDir(SCREENSHOT_DIR);
    return path.join(SCREENSHOT_DIR, name);
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: { width: 1280, height: 720 },
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,720"],
    });
    const page = await browser.newPage();

    try {
        log("Bước 1: Đăng nhập tài khoản Admin (admin@gmail.com / 123456)");
        await page.goto(BASE_URL + "/pages/auth/login.html", { waitUntil: "networkidle0" });
        await sleep(500);

        await page.type("#username", "admin@gmail.com");
        await page.type("#password", "123456");

        await page.click("button[type='submit']");
        await sleep(2000);

        log("  -> Đã submit form đăng nhập");
        log("Bước 2: Vào trang Quản lý Tour");

        await page.goto(BASE_URL + "/pages/admin/dashboard.html?page=tour", { waitUntil: "networkidle0" });
        await page.waitForSelector("#tour-list-container", { timeout: 15000 });
        await sleep(1000);
        log("  -> Danh sách tour hiển thị");

        log("Bước 3: Click nút 'Thêm Tour Mới'");
        const addBtn = await page.waitForSelector('[data-bs-target="#addTourModal"]', { timeout: 5000 });
        await addBtn.click();
        await page.waitForSelector("#addTourModal.show", { timeout: 5000 });
        log("  -> Modal 'Thêm Tour Mới' mở ra");

        log("Bước 4-9: Nhập dữ liệu các trường (bỏ trống tên tour)");
        await page.type("#location", "TP.HCM");
        await page.type("#price_default", "3500000");
        await page.type("#price_child", "2500000");
        await page.select("#region", "Miền Nam");
        await page.type("#duration", "3 ngày 2 đêm");
        await page.type("#description", "Tour tham quan các địa điểm nổi tiếng tại Củ Chi");
        log("  -> Đã nhập 6 trường, để trống Tên tour");

        await page.screenshot({
            path: shotPath("01_before_submit.png"),
            fullPage: true,
        });

        log("Bước 10: Click nút 'Thêm' (không có tên tour)");
        const submitBtn = await page.$("#add-tour-form button[type='submit']");
        if (!submitBtn) throw new Error("Không tìm thấy nút submit");
        await submitBtn.click();

        await sleep(500);

        const modalStillOpen = await page.$("#addTourModal.show");
        const nameValid = await page.$eval("#name", el => el.validity.valid);
        const validationMsg = await page.$eval("#name", el => el.validationMessage);
        const notificationShown = await page.$("#notificationModal.show");

        log("  -> Modal còn mở: " + !!modalStillOpen);
        log("  -> validity.valid: " + nameValid);
        log("  -> validationMessage: \"" + validationMsg + "\"");

        await page.screenshot({
            path: shotPath("02_after_submit.png"),
            fullPage: true,
        });

        let testPassed = !!modalStillOpen && !nameValid && !notificationShown;

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Validation không hoạt động như mong đợi`);
        }
        log("Status: " + (testPassed ? "SUCCESS" : "CHECK_MANUALLY") + "\n");

    } catch (error) {
        log(`\n❌ ${TEST_NAME}: FAIL`);
        log("Lỗi: " + error.message + "\n");

        await page.screenshot({
            path: shotPath("error.png"),
            fullPage: true,
        });
    } finally {
        await browser.close();
    }
})();
