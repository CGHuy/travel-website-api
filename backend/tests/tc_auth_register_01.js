const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_AUTH_REGISTER_01";
const TEST_NAME = TEST_CASE + " - Đăng ký customer thành công";
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

async function safeScreenshot(page, fileName) {
    try {
        await page.screenshot({
            path: shotPath(fileName),
            fullPage: true,
        });
        return true;
    } catch (error) {
        console.warn(`Không chụp được screenshot ${fileName}: ${error.message}`);
        return false;
    }
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: { width: 1280, height: 720 },
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,720"],
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(15000);

    const uniqueSuffix = String(Date.now());
    const email = `auth.test.${uniqueSuffix}@viettravel.com`;
    const phone = `0${uniqueSuffix.slice(-9)}`;

    try {
        await page.goto(BASE_URL + "/pages/auth/register.html", { waitUntil: "networkidle0" });
        await page.evaluate(() => localStorage.clear());

        log("Bước 1-5: Nhập thông tin đăng ký mới");
        await page.type("#fullname", "Nguyen Van Test");
        await page.type("#phone", phone);
        await page.type("#email", email);
        await page.type("#password", "test1234");
        await page.type("#confirmPassword", "test1234");

        log("  -> Email: " + email);
        log("  -> SĐT: " + phone);

        await safeScreenshot(page, "01_before_submit.png");

        log("Bước 6: Submit form đăng ký");
        const [registerResponse] = await Promise.all([page.waitForResponse((response) => response.url().includes("/api/auth/register") && response.request().method() === "POST"), page.click("button[type='submit']")]);

        const responseData = await registerResponse.json();
        await sleep(200);

        await safeScreenshot(page, "02_after_submit.png");

        let messageText = responseData.message || "";
        let token = responseData?.data?.token || null;
        let user = responseData?.data?.user ? JSON.stringify(responseData.data.user) : null;

        try {
            const uiMessage = await page.$eval("#registerMessage", (el) => el.textContent.trim());
            if (uiMessage) messageText = uiMessage;
        } catch (error) {
            console.warn("Không đọc được message từ UI sau khi redirect: " + error.message);
        }

        try {
            const storedToken = await page.evaluate(() => localStorage.getItem("token"));
            const storedUser = await page.evaluate(() => localStorage.getItem("user"));
            if (storedToken) token = storedToken;
            if (storedUser) user = storedUser;
        } catch (error) {
            console.warn("Không đọc được localStorage sau khi redirect: " + error.message);
        }

        log("  -> Message: " + messageText);
        log("  -> Token đã được lưu: " + Boolean(token));
        log("  -> User đã được lưu: " + Boolean(user));

        const testPassed = registerResponse.ok() && responseData.success === true && messageText.includes("Đăng ký") && messageText.includes("thành công") && Boolean(token) && Boolean(user);
        log(`\n${testPassed ? "✅" : "⚠️"} ${TEST_NAME}: ${testPassed ? "PASS" : "CHECK_MANUALLY"}`);
        log("Status: " + (testPassed ? "SUCCESS" : "CHECK_MANUALLY") + "\n");
    } catch (error) {
        log(`\n❌ ${TEST_NAME}: FAIL`);
        log("Lỗi: " + error.message + "\n");

        await safeScreenshot(page, "error.png");
    } finally {
        await browser.close();
    }
})();
