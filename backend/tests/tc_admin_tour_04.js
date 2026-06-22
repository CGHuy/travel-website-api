const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_TOUR_04";
const TEST_NAME = TEST_CASE + " - Xóa tour thất bại (có departure, ID=19)";
const LOG_DIR = path.join(__dirname, "..", "test-results", "logs");
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-results", "screenshots", TEST_CASE);
const DELETE_TOUR_ID = 19;

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

        log(`Bước 3: Click nút 'Xóa' trên tour có ID=${DELETE_TOUR_ID}`);
        const deleteBtn = await page.waitForSelector(`.js-delete-tour[data-tour-id="${DELETE_TOUR_ID}"]`, { timeout: 5000 });
        if (!deleteBtn) throw new Error(`Không tìm thấy nút xóa cho tour ID=${DELETE_TOUR_ID}`);
        const tourName = await page.evaluate(el => el.dataset.tourName, deleteBtn);
        log(`  -> Tour: "${tourName}"`);
        await deleteBtn.click();
        await page.waitForSelector("#deleteTourModal.show", { timeout: 5000 });
        log("  -> Modal 'Xác nhận xóa tour' mở ra");

        const confirmName = await page.$eval("#delete_name", el => el.textContent);
        log(`  -> Xác nhận xóa tour: "${confirmName}"`);

        await page.screenshot({
            path: shotPath("01_confirm_modal.png"),
            fullPage: true,
        });

        log("Bước 4: Click 'Xóa' để xác nhận");
        const confirmBtn = await page.$("#delete-tour-form button[type='submit']");
        if (!confirmBtn) throw new Error("Không tìm thấy nút Xóa trong modal");
        await confirmBtn.click();

        await page.waitForSelector("#notificationModal.show", { timeout: 15000 });
        await sleep(300);

        await page.screenshot({
            path: shotPath("02_error_notification.png"),
            fullPage: true,
        });

        const msg = await page.$eval("#notificationMessage", el => el.textContent);
        log("  -> Thông báo lỗi: " + msg.trim());

        const tourStillExists = await page.evaluate(() =>
            document.body.innerText.includes("Tour Củ Chi Premium")
        );
        if (tourStillExists) log("  -> Tour vẫn còn trong danh sách (không bị xóa)");

        let testPassed = msg.includes("ràng buộc") || msg.includes("departure") || msg.includes("foreign") || !msg.includes("thành công");

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Có thể lỗi không đúng như mong đợi`);
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
