const { execSync } = require("child_process");
const puppeteer = require("puppeteer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const CONFIG = {
  BASE_URL: "http://localhost:3000",
  ADMIN_USERNAME: "tour-staff@gmail.com",
  ADMIN_PASSWORD: "123456",
  HEADLESS: true,
  SLOW_MO: 0,
  TIMEOUT: 15000,
};

const SCREENSHOT_DIR = path.join(__dirname, "..", "screenshots");
const EXCEL_DIR = path.join(__dirname, "..", "excel");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function screenshot(page, folder, filename) {
  const dir = path.join(SCREENSHOT_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, filename), fullPage: false });
}

async function login(page) {
  await page.goto(`${CONFIG.BASE_URL}/pages/auth/login.html`, {
    waitUntil: "networkidle2",
    timeout: CONFIG.TIMEOUT,
  });

  await page.type("#username", CONFIG.ADMIN_USERNAME, { delay: 50 });
  await page.type("#password", CONFIG.ADMIN_PASSWORD, { delay: 50 });
  await screenshot(page, "Login", "login_filled.png");

  await page.click("#loginForm button[type='submit']");
  await sleep(800);

  await screenshot(page, "Login", "login_result.png");
}

async function navigateToService(page) {
  await page.goto(`${CONFIG.BASE_URL}/pages/admin/dashboard.html?page=service`, {
    waitUntil: "networkidle2",
    timeout: CONFIG.TIMEOUT,
  });
  await page.waitForSelector("#service-table-body", { timeout: CONFIG.TIMEOUT });
  await sleep(1000);
}

function readExcel(filename) {
  const filePath = path.join(EXCEL_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets["Test Cases"];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  return data.slice(1).filter((row) => row[0]);
}

function writeExcel(filename, data) {
  const headers = ["TC", "Tên Dịch vụ", "Slug", "Mô tả", "Hoạt động", "Kết quả mong đợi", "Kết quả thực tế", "Pass/Fail"];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [
    { wch: 14 }, { wch: 50 }, { wch: 50 }, { wch: 60 },
    { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
  XLSX.writeFile(wb, path.join(EXCEL_DIR, filename));
}

async function runSingleTest(page, testCase, folderName) {
  const [tcId, name, slug, desc, status, expected] = testCase;
  console.log(`\n>>> Running ${tcId}...`);

  let screenshotFile = `${tcId}_result.png`;
  let pass = false;
  const expectedStr = expected || "";

  try {
    await navigateToService(page);

    const addBtn = await page.waitForSelector('[data-bs-target="#addServiceModal"]', { timeout: CONFIG.TIMEOUT });
    await addBtn.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
    await sleep(200);
    await addBtn.click();
    await page.waitForSelector("#service-form", { timeout: CONFIG.TIMEOUT });
    await sleep(200);

    const nameInput = await page.waitForSelector("#service-name", { timeout: CONFIG.TIMEOUT });
    await nameInput.evaluate((el) => el.value = "");
    if (name) {
      await nameInput.evaluate((el, text) => { el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); }, name);
      await sleep(50);
    }

    const slugInput = await page.waitForSelector("#service-slug", { timeout: CONFIG.TIMEOUT });
    await slugInput.evaluate((el) => el.value = "");
    if (slug) {
      await slugInput.evaluate((el, text) => { el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); }, slug);
      await sleep(50);
    }

    if (desc) {
      const descInput = await page.waitForSelector("#service-description", { timeout: CONFIG.TIMEOUT });
      await descInput.evaluate((el) => el.value = "");
      await descInput.evaluate((el, text) => { el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); }, desc);
      await sleep(50);
    }

    const checkbox = await page.waitForSelector("#service-status", { timeout: CONFIG.TIMEOUT });
    const isChecked = await checkbox.evaluate((el) => el.checked);
    if ((status === "Checked" && !isChecked) || (status !== "Checked" && isChecked)) {
      await checkbox.click();
    }

    await sleep(100);
    await page.evaluate(() => {
      const form = document.getElementById("service-form");
      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
    await sleep(1000);
    // Wait for addServiceModal to close OR error/invalid to appear, up to 8s
    for (let i = 0; i < 14; i++) {
      const state = await page.evaluate(() => {
        const modal = document.getElementById("addServiceModal");
        const error = document.getElementById("service-form-error");
        const invalid = document.querySelector(".is-invalid");
        return {
          modalClosed: !modal || !modal.classList.contains("show"),
          hasError: error && !error.classList.contains("d-none"),
          hasInvalid: !!invalid,
        };
      });
      if (state.modalClosed || state.hasError || state.hasInvalid) break;
      await sleep(500);
    }
    await sleep(500);

    await screenshot(page, folderName, screenshotFile);

    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById("addServiceModal");
      return modal && modal.classList.contains("show");
    });

    const errorText = await page.evaluate(() => {
      const el = document.getElementById("service-form-error");
      if (el && !el.classList.contains("d-none")) return el.textContent.trim();
      return "";
    });

    const invalidFields = await page.evaluate(() => {
      const fields = [];
      document.querySelectorAll(".is-invalid").forEach((el) => {
        const label = el.previousElementSibling || el.id;
        fields.push(label.textContent?.trim() || el.id);
      });
      return fields;
    });

    const keyPhrases = expectedStr.match(/'([^']+)'/g)?.map(p => p.replace(/'/g, "")) || [];
    const errMatch = errorText && keyPhrases.some(k => errorText.includes(k));
    const invalidMatch = invalidFields.length > 0 && keyPhrases.some(k => invalidFields.join(" ").includes(k));

    // Maxlength pre-check
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
      pass = errMatch || invalidMatch;
    } else {
      pass = false;
    }
  } catch (err) {
    console.error(`ERROR in ${tcId}:`, err.message);
    pass = false;
  }

  console.log(`  Result: ${pass ? "PASS" : "FAIL"} - ${screenshotFile}`);
  return [tcId, name, slug, desc, status, expected, screenshotFile, pass ? "PASS" : "FAIL"];
}

function restoreDB() {
  const sqlFile = path.join(__dirname, "..", "..", "db_vietravel_KTPM.sql");
  if (!fs.existsSync(sqlFile)) {
    console.error(`Backup file not found: ${sqlFile}`);
    return;
  }
  console.log("\nRestoring database from backup...");
  const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 9.6\\bin\\mysql.exe";
  const cmd = `cmd.exe /c type "${sqlFile}" | "${MYSQL}" -u root -proot123 db_viet_tour`;
  execSync(cmd, {
    stdio: "inherit",
    timeout: 60000,
  });
  console.log("Database restored.");
}

async function runAllTests(filename, folderName) {
  const testCases = readExcel(filename);
  console.log(`\n========== Running: ${filename} (${testCases.length} test cases) ==========`);

  restoreDB();

  const browser = await puppeteer.launch({
    headless: CONFIG.HEADLESS,
    slowMo: CONFIG.SLOW_MO,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(CONFIG.TIMEOUT);
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

module.exports = { CONFIG, runAllTests };
