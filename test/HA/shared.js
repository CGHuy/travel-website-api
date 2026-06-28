const { execSync } = require("child_process");
const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const TIMEOUT = 15000;
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
const EXCEL_DIR = path.join(__dirname, "excel");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function screenshot(page, folder, filename) {
  const dir = path.join(SCREENSHOT_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, filename) });
}

async function login(page) {
  await page.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "networkidle2", timeout: TIMEOUT });
  await page.type("#username", "tour-staff@gmail.com", { delay: 50 });
  await page.type("#password", "123456", { delay: 50 });
  await page.click("#loginForm button[type='submit']");
  await sleep(800);
  await screenshot(page, "Login", "login_result.png");
}

async function navigateToService(page) {
  await page.goto(`${BASE_URL}/pages/admin/dashboard.html?page=service`, { waitUntil: "networkidle2", timeout: TIMEOUT });
  await page.waitForSelector("#service-table-body", { timeout: TIMEOUT });
  await sleep(1000);
}

function readExcel(filename) {
  const filePath = path.join(EXCEL_DIR, filename);
  if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); return []; }
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets["Test Cases"], { header: 1 }).slice(1).filter((r) => r[0]);
}

const EXCEL_HEADERS = ["TC", "Tên Dịch vụ", "Slug", "Mô tả", "Hoạt động", "Kết quả mong đợi", "Kết quả thực tế", "Pass/Fail"];
const EXCEL_COLS = [{ wch: 14 }, { wch: 50 }, { wch: 50 }, { wch: 60 }, { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 10 }];

function writeExcel(filename, data) {
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...data]);
  ws["!cols"] = EXCEL_COLS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
  XLSX.writeFile(wb, path.join(EXCEL_DIR, filename));
}

function restoreDB() {
  const sqlFile = path.join(__dirname, "..", "..", "db_vietravel_KTPM.sql");
  if (!fs.existsSync(sqlFile)) { console.error(`Backup not found: ${sqlFile}`); return; }
  console.log("\nRestoring database from backup...");
  execSync(`cmd.exe /c type "${sqlFile}" | "C:\\Program Files\\MySQL\\MySQL Server 9.6\\bin\\mysql.exe" -u root -proot123 db_viet_tour`, { stdio: "inherit", timeout: 60000 });
  console.log("Database restored.");
}

async function setFieldValue(page, selector, value) {
  const el = await page.waitForSelector(selector, { timeout: TIMEOUT });
  await el.evaluate((e) => e.value = "");
  if (value) {
    await el.evaluate((e, text) => { e.value = text; e.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    await sleep(50);
  }
}

async function runSingleTest(page, testCase, folderName) {
  const [tcId, name, slug, desc, status, expected] = testCase;
  console.log(`\n>>> Running ${tcId}...`);
  const expectedStr = expected || "";
  let pass = false;

  try {
    await navigateToService(page);

    const addBtn = await page.waitForSelector('[data-bs-target="#addServiceModal"]', { timeout: TIMEOUT });
    await addBtn.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
    await sleep(200);
    await addBtn.click();
    await page.waitForSelector("#service-form", { timeout: TIMEOUT });
    await sleep(200);

    await setFieldValue(page, "#service-name", name);
    await setFieldValue(page, "#service-slug", slug);
    await setFieldValue(page, "#service-description", desc);

    const checkbox = await page.waitForSelector("#service-status", { timeout: TIMEOUT });
    const isChecked = await checkbox.evaluate((el) => el.checked);
    if ((status === "Checked" && !isChecked) || (status !== "Checked" && isChecked)) await checkbox.click();

    await sleep(100);
    await page.evaluate(() => document.getElementById("service-form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
    await sleep(1000);

    for (let i = 0; i < 14; i++) {
      const state = await page.evaluate(() => {
        const modal = document.getElementById("addServiceModal");
        const error = document.getElementById("service-form-error");
        return {
          modalClosed: !modal || !modal.classList.contains("show"),
          hasError: error && !error.classList.contains("d-none"),
          hasInvalid: !!document.querySelector(".is-invalid"),
        };
      });
      if (state.modalClosed || state.hasError || state.hasInvalid) break;
      await sleep(500);
    }
    await sleep(500);

    const screenshotFile = `${tcId}_result.png`;
    await screenshot(page, folderName, screenshotFile);

    const { modalVisible, errorText, invalidFields } = await page.evaluate(() => {
      const modal = document.getElementById("addServiceModal");
      const errorEl = document.getElementById("service-form-error");
      const fields = [];
      document.querySelectorAll(".is-invalid").forEach((el) => {
        const label = el.previousElementSibling || el.id;
        fields.push(label.textContent?.trim() || el.id);
      });
      return {
        modalVisible: modal && modal.classList.contains("show"),
        errorText: errorEl && !errorEl.classList.contains("d-none") ? errorEl.textContent.trim() : "",
        invalidFields: fields,
      };
    });

    const nameActual = await page.$eval("#service-name", (el) => el.value);
    const slugActual = await page.$eval("#service-slug", (el) => el.value);
    const descActual = await page.$eval("#service-description", (el) => el.value);
    const truncated = !!(name && nameActual.length < name.length) ||
                      !!(slug && slugActual.length < slug.length) ||
                      !!(desc && descActual.length < desc.length);

    console.log(`  DEBUG: modalVisible=${modalVisible} error="${errorText}" invalid=[${invalidFields}]`);
    console.log(`  DEBUG: name="${nameActual.substring(0,30)}"(${nameActual.length}/${name?name.length:'-'}) slug="${slugActual.substring(0,30)}"(${slugActual.length}/${slug?slug.length:'-'}) desc="${descActual.substring(0,30)}"(${descActual.length}/${desc?desc.length:'-'}) truncated=${truncated}`);

    if (expectedStr.includes("thành công")) {
      pass = !modalVisible;
    } else if (expectedStr.includes("chặn")) {
      pass = truncated || invalidFields.length > 0;
    } else if (expectedStr.includes("Tô đỏ") || expectedStr.includes("Viền đỏ")) {
      pass = invalidFields.length > 0 || errorText.includes("Vui lòng");
    } else if (modalVisible && errorText) {
      const phrases = expectedStr.match(/'([^']+)'/g)?.map((p) => p.replace(/'/g, "")) || [];
      pass = phrases.some((k) => errorText.includes(k)) ||
             (invalidFields.length > 0 && phrases.some((k) => invalidFields.join(" ").includes(k)));
    }
  } catch (err) {
    console.error(`ERROR in ${tcId}:`, err.message);
  }

  console.log(`  Result: ${pass ? "PASS" : "FAIL"} - ${tcId}_result.png`);
  return [tcId, name, slug, desc, status, expected, `${tcId}_result.png`, pass ? "PASS" : "FAIL"];
}

async function runAllTests(filename, folderName) {
  const testCases = readExcel(filename);
  console.log(`\n========== Running: ${filename} (${testCases.length} test cases) ==========`);
  restoreDB();

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);
  page.setViewport({ width: 1366, height: 768 });

  try {
    console.log("\nLogging in...");
    await login(page);
    console.log("Login done.");

    const results = [];
    for (const tc of testCases) {
      const result = await runSingleTest(page, tc, folderName);
      results.push(result);
      writeExcel(filename, results);
      console.log(`  -> Saved to excel/${filename}`);
    }
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await browser.close();
  }
}

module.exports = { runAllTests };
