const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_USER_CHANGE_PASSWORD_01";
const TEST_NAME = TEST_CASE + " - Đổi mật khẩu customer thành công và khôi phục lại mật khẩu cũ";
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

async function login(page, username, password) {
    await page.goto(BASE_URL + "/pages/auth/login.html", { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
    await page.type("#username", username);
    await page.type("#password", password);
    await page.click("button[type='submit']");
    await page.waitForFunction(
        () => {
            const message = document.getElementById("loginMessage");
            return message && message.classList.contains("alert-success") && localStorage.getItem("token");
        },
        { timeout: 10000 },
    );
    await sleep(300);
}

async function submitChangePassword(page, currentPassword, newPassword) {
    await page.goto(BASE_URL + "/pages/user/change-password.html", { waitUntil: "networkidle0" });
    await page.waitForSelector("#globalToastBody", { timeout: 10000 });
    await page.waitForSelector("#change-password-form", { timeout: 10000 });

    await page.$eval("#currentPassword", (el) => (el.value = ""));
    await page.$eval("#newPassword", (el) => (el.value = ""));
    await page.$eval("#confirmPassword", (el) => (el.value = ""));

    await page.type("#currentPassword", currentPassword);
    await page.type("#newPassword", newPassword);
    await page.type("#confirmPassword", newPassword);

    await page.screenshot({
        path: shotPath(`before_${newPassword.replace(/[^a-zA-Z0-9]/g, "_")}.png`),
        fullPage: true,
    });

    const oldToken = await page.evaluate(() => localStorage.getItem("token"));
    await page.click("#change-password-form button[type='submit']");

    await page.waitForFunction(
        (previousToken) => {
            const toast = document.getElementById("globalToastBody");
            const token = localStorage.getItem("token");
            return toast && toast.textContent.includes("Đổi mật khẩu thành công") && token && token !== previousToken;
        },
        { timeout: 10000 },
        oldToken,
    );
    await sleep(300);

    const toastText = await page.$eval("#globalToastBody", (el) => el.textContent.trim());
    const currentToken = await page.evaluate(() => localStorage.getItem("token"));

    await page.screenshot({
        path: shotPath(`after_${newPassword.replace(/[^a-zA-Z0-9]/g, "_")}.png`),
        fullPage: true,
    });

    return { toastText, currentToken, oldToken };
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: { width: 1280, height: 720 },
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,720"],
    });
    const page = await browser.newPage();

    const originalPassword = "123456";
    const tempPassword = "Temp123456";
    const username = "tuan@gmail.com";

    try {
        log("Bước 1: Đăng nhập customer để lấy token");
        await login(page, username, originalPassword);
        const tokenBeforeChange = await page.evaluate(() => localStorage.getItem("token"));
        log("  -> Đã đăng nhập thành công");

        log("Bước 2: Đổi mật khẩu sang mật khẩu tạm");
        const firstChange = await submitChangePassword(page, originalPassword, tempPassword);
        log("  -> Toast: " + firstChange.toastText);
        log("  -> Token đã đổi: " + (firstChange.currentToken !== tokenBeforeChange));

        log("Bước 3: Đăng nhập lại bằng mật khẩu tạm để xác nhận");
        await login(page, username, tempPassword);
        const tokenAfterTempLogin = await page.evaluate(() => localStorage.getItem("token"));
        log("  -> Đăng nhập bằng mật khẩu tạm thành công");

        log("Bước 4: Khôi phục lại mật khẩu cũ");
        const secondChange = await submitChangePassword(page, tempPassword, originalPassword);
        log("  -> Toast: " + secondChange.toastText);
        log("  -> Token đã đổi lần 2: " + (secondChange.currentToken !== tokenAfterTempLogin));

        const testPassed = firstChange.toastText.includes("Đổi mật khẩu thành công") && secondChange.toastText.includes("Đổi mật khẩu thành công") && firstChange.currentToken !== tokenBeforeChange && secondChange.currentToken !== tokenAfterTempLogin;

        log(`\n${testPassed ? "✅" : "⚠️"} ${TEST_NAME}: ${testPassed ? "PASS" : "CHECK_MANUALLY"}`);
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
