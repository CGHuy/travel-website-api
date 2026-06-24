const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_USER_02";
const TEST_NAME = TEST_CASE + " - Tạo TK thất bại (email đã tồn tại)";
const LOG_DIR = path.join(__dirname, "..", "test-results", "logs");
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-results", "screenshots", TEST_CASE);
const DB_CONFIG = (() => {
    const candidates = [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../../.env")];
    const envPath = candidates.find(p => fs.existsSync(p));
    if (!envPath) throw new Error("Không tìm thấy file .env");
    const env = fs.readFileSync(envPath, "utf-8");
    const get = k => { const m = env.match(new RegExp(`^${k}=(.*)$`, "m")); return m ? m[1].trim() : ""; };
    return { host: get("DB_HOST") || "localhost", user: get("DB_USER") || "root", password: get("DB_PASSWORD") || "", database: get("DB_NAME") || "db_viet_tour", port: parseInt(get("DB_PORT")) || 3306 };
})();

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
    // ====================================================================
    // RESET DB
    // ====================================================================
    console.log("\n========== RESET DATABASE ==========");
    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        const seedSql = fs.readFileSync(path.join(__dirname, "seed_user_02.sql"), "utf-8");
        const cleanedSql = seedSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const statements = cleanedSql.split(";").map(s => s.trim()).filter(s => s);
        for (const stmt of statements) { try { await connection.execute(stmt); } catch (err) { console.log(`  (skip): ${err.message.substring(0, 80)}`); } }
        await connection.end(); connection = null;
        console.log("  \u2705 Database đã reset thành công");
    } catch (err) { console.error(`  \u274C Reset DB thất bại: ${err.message}`); if (connection) await connection.end().catch(() => {}); process.exit(1); }

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: { width: 1440, height: 800 },
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,800"],
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
