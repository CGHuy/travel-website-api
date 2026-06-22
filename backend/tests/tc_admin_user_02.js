const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_USER_02";
const TEST_NAME = TEST_CASE + " - Tạo TK thất bại (email đã tồn tại)";
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
        log("Bước 2: Vào trang Quản lý User");

        await page.goto(BASE_URL + "/pages/admin/dashboard.html?page=user", { waitUntil: "networkidle0" });
        await page.waitForSelector("#userTableBody", { timeout: 15000 });
        await sleep(1000);
        log("  -> Danh sách user hiển thị");

        log("Bước 3: Click nút 'Tạo tài khoản nhân viên'");
        const openBtn = await page.waitForSelector("#openCreateStaffBtn", { timeout: 5000 });
        await openBtn.click();
        await page.waitForSelector("#createStaffModal.show", { timeout: 5000 });
        log("  -> Modal 'Tạo tài khoản nhân viên' mở ra");

        log("Bước 4: Chọn vai trò 'NV Booking'");
        await page.click("label[for='roleBooking']");
        await sleep(200);

        log("Bước 5-9: Nhập thông tin (email đã tồn tại)");
        await page.type("#staffFullname", "Trần Thị B");
        await page.type("#staffPhone", "0987654321");
        await page.type("#staffEmail", "nam@gmail.com");
        await page.type("#staffPassword", "matkhau123");
        await page.type("#staffConfirmPassword", "matkhau123");
        log("  -> Đã nhập: họ tên, SĐT, email=nam@gmail.com, mật khẩu");

        await page.screenshot({
            path: shotPath("01_before_submit.png"),
            fullPage: true,
        });

        log("Bước 10: Click 'Tạo tài khoản'");
        const saveBtn = await page.waitForSelector("#saveCreateStaffBtn", { timeout: 5000 });
        await saveBtn.click();

        await sleep(2000);

        const modalStillOpen = await page.$("#createStaffModal.show");
        const errorVisible = await page.$eval("#staffFormError", el => el.style.display !== "none" && el.textContent.trim().length > 0);
        const errorText = errorVisible ? await page.$eval("#staffFormError", el => el.textContent.trim()) : "";

        log("  -> Modal còn mở: " + !!modalStillOpen);
        log("  -> Lỗi hiển thị: " + errorVisible);
        if (errorText) log("  -> Nội dung lỗi: " + errorText);

        await page.screenshot({
            path: shotPath("02_after_submit.png"),
            fullPage: true,
        });

        let testPassed = !!modalStillOpen && errorVisible;

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Không thấy lỗi hoặc modal đã đóng`);
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
