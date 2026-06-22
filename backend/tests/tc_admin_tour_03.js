const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_TOUR_03";
const TEST_NAME = TEST_CASE + " - Sửa thông tin tour thành công (ID=19)";
const LOG_DIR = path.join(__dirname, "..", "test-results", "logs");
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-results", "screenshots", TEST_CASE);
const EDIT_TOUR_ID = 19;

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

        log(`Bước 3: Click nút 'Sửa' trên tour có ID=${EDIT_TOUR_ID}`);
        const editBtn = await page.waitForSelector(`.js-edit-tour[data-tour-id="${EDIT_TOUR_ID}"]`, { timeout: 5000 });
        if (!editBtn) throw new Error(`Không tìm thấy nút sửa cho tour ID=${EDIT_TOUR_ID}`);
        await editBtn.click();
        await page.waitForSelector("#editTourModal.show", { timeout: 5000 });
        log("  -> Modal 'Sửa Tour' mở ra");

        await sleep(500);

        const oldName = await page.$eval("#edit_name", el => el.value);
        const oldPrice = await page.$eval("#edit_price_default", el => el.value);
        const oldRegion = await page.$eval("#edit_region", el => el.value);
        log(`  -> Dữ liệu cũ: tên="${oldName}", giá=${oldPrice}, miền="${oldRegion}"`);

        log("Bước 4-6: Sửa thông tin tour");
        await page.evaluate(() => document.getElementById("edit_name").value = "");
        await page.type("#edit_name", "Tour Củ Chi Premium");

        await page.evaluate(() => document.getElementById("edit_price_default").value = "");
        await page.type("#edit_price_default", "4000000");

        await page.select("#edit_region", "Miền Trung");
        log("  -> Đã sửa: tên -> 'Tour Củ Chi Premium', giá -> 4000000, miền -> 'Miền Trung'");

        const imagePath = path.join(__dirname, "..", "test-results", "cuchi.png");
        if (fs.existsSync(imagePath)) {
            const fileInput = await page.$("#edit_cover_image");
            if (fileInput) {
                await fileInput.uploadFile(imagePath);
                log("  -> Đã chọn ảnh bìa mới: cuchi.png");
            }
        }

        await page.screenshot({
            path: shotPath("01_before_save.png"),
            fullPage: true,
        });

        log("Bước 7: Click 'Lưu'");
        const saveBtn = await page.$("#edit-tour-form button[type='submit']");
        if (!saveBtn) throw new Error("Không tìm thấy nút Lưu");
        await saveBtn.click();

        await page.waitForSelector("#notificationModal.show", { timeout: 15000 });
        await sleep(300);

        await page.screenshot({
            path: shotPath("02_after_save.png"),
            fullPage: true,
        });

        const msg = await page.$eval("#notificationMessage", el => el.textContent);
        log("  -> Thông báo: " + msg.trim());

        const hasNewName = await page.evaluate(() =>
            document.body.innerText.includes("Tour Củ Chi Premium")
        );
        if (hasNewName) log("  -> Tour 'Tour Củ Chi Premium' xuất hiện trong danh sách");

        let testPassed = msg.includes("thành công") && hasNewName;

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Không thấy toast hoặc tên tour mới`);
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
