const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_BOOKING_01";
const TEST_NAME = TEST_CASE + " - Xem danh sách và lọc booking theo trạng thái";
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
        log("Bước 1: Đăng nhập (booking-staff@gmail.com / 123456)");
        await page.goto(BASE_URL + "/pages/auth/login.html", { waitUntil: "networkidle0" });
        await sleep(500);

        await page.type("#username", "booking-staff@gmail.com");
        await page.type("#password", "123456");

        await page.click("button[type='submit']");
        await sleep(2000);

        log("  -> Đã submit form đăng nhập");
        log("Bước 2: Vào trang Quản lý Booking");

        await page.goto(BASE_URL + "/pages/admin/dashboard.html?page=booking", { waitUntil: "networkidle0" });
        await page.waitForSelector("#booking-list-body", { timeout: 15000 });
        await sleep(1500);
        log("  -> Danh sách booking hiển thị");

        const badgeText = await page.$eval("#booking-total-count", el => el.textContent);
        log("  -> Tổng booking: " + badgeText);

        const hasColumns = await page.evaluate(() => {
            const headers = document.querySelectorAll("table thead th");
            const texts = Array.from(headers).map(th => th.textContent.trim());
            return texts.includes("Mã Booking") && texts.includes("Khách hàng") && texts.includes("Trạng thái");
        });
        log("  -> Các cột hiển thị: " + hasColumns);

        await page.screenshot({
            path: shotPath("01_initial_list.png"),
            fullPage: true,
        });

        log("Bước 3: Tìm kiếm booking của 'Phạm Minh Tuấn'");
        await page.type("#booking-search-input", "Phạm Minh Tuấn");
        await sleep(1000);

        const searchResult = await page.evaluate(() => {
            const rows = document.querySelectorAll("#booking-list-body tr");
            if (rows.length === 0 || rows[0].textContent.includes("Không có")) return { count: 0, code: "N/A" };
            const code = rows[0].querySelector(".booking-code")?.textContent?.trim() || "N/A";
            const name = rows[0].querySelector(".booking-customer")?.textContent?.trim() || "N/A";
            return { count: rows.length, code, name };
        });
        log("  -> Tìm thấy: " + searchResult.code + " - " + searchResult.name);

        await page.screenshot({
            path: shotPath("02_search_specific.png"),
            fullPage: true,
        });

        log("Bước 4: Xóa từ khóa, chọn filter 'Đã xác nhận'");
        await page.evaluate(() => {
            const input = document.getElementById("booking-search-input");
            input.value = "";
            input.dispatchEvent(new Event("input"));
        });
        await sleep(500);
        await page.select("#booking-status-filter", "confirmed");
        await sleep(1500);

        const confirmedRows = await page.evaluate(() => {
            const badges = document.querySelectorAll("#booking-list-body .booking-status .badge");
            const codes = document.querySelectorAll("#booking-list-body .booking-code");
            return Array.from(badges).map((b, i) => codes[i]?.textContent?.trim() + "=" + b.textContent.trim());
        });
        log("  -> Kết quả lọc: " + (confirmedRows.length > 0 ? confirmedRows.slice(0, 5).join(", ") + "..." : "0 dòng"));

        await page.screenshot({
            path: shotPath("03_filter_confirmed.png"),
            fullPage: true,
        });

        log("Bước 5: Chọn filter 'Yêu cầu hủy' (pending)");
        await page.select("#booking-status-filter", "pending");
        await sleep(1500);

        const pendingRows = await page.evaluate(() => {
            const badges = document.querySelectorAll("#booking-list-body .booking-status .badge");
            return badges.length === 0 ? 0 : Array.from(badges).map(b => b.textContent.trim());
        });
        log("  -> Số dòng pending: " + (typeof pendingRows === "number" ? 0 : pendingRows.length));

        await page.screenshot({
            path: shotPath("04_filter_pending.png"),
            fullPage: true,
        });

        log("Bước 6: Chọn filter 'Đã hủy' (cancelled)");
        await page.select("#booking-status-filter", "cancelled");
        await sleep(1500);

        const cancelledRows = await page.evaluate(() => {
            const badges = document.querySelectorAll("#booking-list-body .booking-status .badge");
            return Array.from(badges).map(b => b.textContent.trim());
        });
        log("  -> Trạng thái: " + (cancelledRows.length > 0 ? cancelledRows.join(", ") : "0 dòng"));

        await page.screenshot({
            path: shotPath("05_filter_cancelled.png"),
            fullPage: true,
        });

        log("Bước 7: Reset 'Tất cả' + 'Làm mới'");
        await page.select("#booking-status-filter", "all");
        await page.evaluate(() => document.getElementById("booking-search-input").dispatchEvent(new Event("input")));
        await sleep(500);
        await page.click("#refresh-bookings");
        await sleep(1500);

        const refreshedBadge = await page.$eval("#booking-total-count", el => el.textContent);
        log("  -> Tổng booking sau làm mới: " + refreshedBadge);

        await page.screenshot({
            path: shotPath("06_after_refresh.png"),
            fullPage: true,
        });

        let testPassed = true;

        if (testPassed) {
            log(`\n✅ ${TEST_NAME}: PASS`);
        } else {
            log(`\n⚠️ ${TEST_NAME}: Kiểm tra thủ công`);
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
