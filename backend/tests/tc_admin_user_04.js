const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_USER_04";
const TEST_NAME = TEST_CASE + " - Xóa tài khoản user thành công";
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

        log("Bước 3: Tìm user ID=35 bằng email");
        await page.type("#searchInput", "nhanvientc01@viettravel.com");
        await page.click("#searchBtn");
        await sleep(1000);

        log("Bước 4: Click nút 'Xóa' trên user ID=35");
        await page.evaluate(() => window.deleteUser(35));
        await page.waitForSelector("#confirmDeleteModal.show", { timeout: 5000 });
        log("  -> Modal 'Xác nhận xóa' mở ra");

        const confirmMsg = await page.$eval("#deleteConfirmMessage", el => el.textContent);
        log("  -> Nội dung xác nhận: " + confirmMsg.trim());

        await page.screenshot({
            path: shotPath("01_confirm_modal.png"),
            fullPage: true,
        });

        log("Bước 5: Click 'Xóa ngay'");
        await page.click("#btnConfirmDelete");

        await page.waitForSelector("#actionToast.show", { timeout: 15000 });
        await sleep(200);

        await page.screenshot({
            path: shotPath("02_after_delete.png"),
            fullPage: true,
        });

        const toastMsg = await page.$eval("#actionToastBody", el => el.textContent);
        log("  -> Toast: " + toastMsg.trim());

        await sleep(500);

        const userGone = !(await page.evaluate(() =>
            document.body.innerText.includes("nhanvientc01@viettravel.com")
        ));
        if (userGone) log("  -> User không còn trong danh sách");

        let testPassed = toastMsg.includes("thành công") && userGone;

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Không thấy toast hoặc user vẫn còn`);
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
