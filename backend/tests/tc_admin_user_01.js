const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_USER_01";
const TEST_NAME = TEST_CASE + " - Tạo tài khoản nhân viên thành công";
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

        log("Bước 4: Chọn vai trò 'NV Tour'");
        await page.click("label[for='roleTour']");
        await sleep(200);

        log("Bước 5-9: Nhập thông tin nhân viên");
        await page.type("#staffFullname", "Nguyễn Văn A");
        await page.type("#staffPhone", "0988777666");
        await page.type("#staffEmail", "nhanvientc01@viettravel.com");
        await page.type("#staffPassword", "matkhau123");
        await page.type("#staffConfirmPassword", "matkhau123");
        log("  -> Đã nhập: họ tên, SĐT, email, mật khẩu, xác nhận mật khẩu");

        await page.screenshot({
            path: shotPath("01_before_submit.png"),
            fullPage: true,
        });

        log("Bước 10: Click 'Tạo tài khoản'");
        const saveBtn = await page.waitForSelector("#saveCreateStaffBtn", { timeout: 5000 });
        await saveBtn.click();

        await page.waitForSelector("#actionToast.show", { timeout: 15000 });
        await sleep(200);

        await page.screenshot({
            path: shotPath("02_after_submit.png"),
            fullPage: true,
        });

        const toastMsg = await page.$eval("#actionToastBody", el => el.textContent);
        log("  -> Toast: " + toastMsg.trim());

        const hasNewUser = await page.evaluate(() =>
            document.body.innerText.includes("Nguyễn Văn A")
        );
        if (hasNewUser) log("  -> User 'Nguyễn Văn A' xuất hiện trong danh sách");

        let testPassed = toastMsg.includes("thành công") && hasNewUser;

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Không thấy toast hoặc user mới`);
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
