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

async function navigateToDeparture(page) {
  await page.goto(`${BASE_URL}/pages/admin/dashboard.html?page=departure`, { waitUntil: "networkidle2", timeout: TIMEOUT });
  await page.waitForSelector("#departureList", { timeout: TIMEOUT });
  await sleep(1000);
}

async function setTourCombobox(page, tourId) {
  await page.evaluate((tourId) => {
    const input = document.getElementById("addTourId");
    input.value = `${tourId} - Tour Phú Quốc 4N3Đ`;
    input.setAttribute("data-tour-id", tourId);
  }, tourId);
  await sleep(100);
}

async function setDateField(page, yyyyMmDd) {
  if (!yyyyMmDd) return;
  await page.evaluate((dateStr) => {
    const picker = document.getElementById("addDepartureDatePicker");
    picker.value = dateStr;
    picker.dispatchEvent(new Event("change", { bubbles: true }));
  }, yyyyMmDd);
}

async function setSelectField(page, selector, value) {
  if (!value) return;
  await page.evaluate(({ selector, value }) => {
    const el = document.querySelector(selector);
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, { selector, value });
}

async function setNumberField(page, selector, value) {
  if (!value) return;
  const isDigitsOnly = /^\d+$/.test(value);
  await page.evaluate(({ selector, value, isDigitsOnly }) => {
    const el = document.querySelector(selector);
    if (isDigitsOnly) {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.type = "text";
      el.value = value;
      el.dataset.sanitized = "1";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, { selector, value, isDigitsOnly });
}

function parseDisplayDateToYmd(displayDate) {
  if (!displayDate) return "";
  const match = displayDate.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!match) return displayDate;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function readExcel(filename) {
  const filePath = path.join(EXCEL_DIR, filename);
  if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); return []; }
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets["Test Cases"], { header: 1 }).slice(1).filter((r) => r[0]);
}

const EXCEL_HEADERS = ["TC", "ID Tour", "Ngày KH", "Địa điểm KH", "Giá NL", "Giá TE", "Tổng số chỗ", "Kết quả mong đợi", "Kết quả thực tế", "Pass/Fail"];
const EXCEL_COLS = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 60 }, { wch: 50 }, { wch: 10 }];

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
  execSync(`cmd.exe /c type "${sqlFile}" | "C:\\Program Files\\MySQL\\MySQL Server 9.6\\bin\\mysql.exe" -u root -p12345 -P 3307 db_viet_tour`, { stdio: "inherit", timeout: 60000 });
  console.log("Database restored.");
}

async function runSingleTest(page, testCase, folderName) {
  const [tcId, tourId, dateDmy, location, priceAdult, priceChild, seats, expected] = testCase;
  console.log(`\n>>> Running ${tcId}...`);
  const expectedStr = String(expected || "");
  let pass = false;
  let actualResult = "";
  let screenshotFile = `${tcId}_result.png`;

  try {
    await navigateToDeparture(page);

    const addBtn = await page.waitForSelector('[data-bs-target="#addDepartureModal"]', { timeout: TIMEOUT });
    await addBtn.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
    await sleep(200);
    await addBtn.click();
    await page.waitForSelector("#addDepartureForm", { timeout: TIMEOUT });
    await sleep(200);

    const tourIdStr = tourId ? String(tourId).trim() : "";
    if (tourIdStr) await setTourCombobox(page, tourIdStr);

    const dateYmd = parseDisplayDateToYmd(dateDmy ? String(dateDmy).trim() : "");
    if (dateYmd) await setDateField(page, dateYmd);

    const locStr = location ? String(location).trim() : "";
    if (locStr) await setSelectField(page, "#addDepartureLocation", locStr);

    await setNumberField(page, "#addPriceMoving", priceAdult ? String(priceAdult).trim() : "");
    await setNumberField(page, "#addPriceMovingChild", priceChild ? String(priceChild).trim() : "");
    await setNumberField(page, "#addSeatsTotal", seats ? String(seats).trim() : "");

    await sleep(200);

    const submitBtn = await page.waitForSelector("#saveAddDepartureBtn", { timeout: TIMEOUT });
    await submitBtn.click();
    await sleep(1500);

    await screenshot(page, folderName, screenshotFile);

    const state = await page.evaluate(() => {
      const modal = document.getElementById("addDepartureModal");
      const modalVisible = modal && modal.classList.contains("show");
      const errors = [];
      document.querySelectorAll(".is-invalid").forEach((el) => {
        const errorId = el.id + "Error";
        const errorEl = document.getElementById(errorId);
        if (errorEl && errorEl.style.display !== "none" && errorEl.textContent) {
          errors.push(errorEl.textContent.trim());
        }
      });
      return { modalVisible, errors };
    });

    if (expectedStr.includes("thành công")) {
      pass = !state.modalVisible;
      actualResult = state.modalVisible ? "Modal vẫn hiển thị" : "Modal đã đóng, thêm thành công";
    } else {
      actualResult = state.errors.length > 0 ? state.errors.join("; ") : "Không có lỗi hiển thị";
      const expectedPhrases = expectedStr.match(/'([^']+)'/g)?.map((p) => p.replace(/'/g, "")) || [];
      if (state.errors.length > 0 && expectedPhrases.length > 0) {
        pass = expectedPhrases.some((phrase) => state.errors.some((err) => err.includes(phrase)));
      }
    }
  } catch (err) {
    console.error(`ERROR in ${tcId}:`, err.message);
    actualResult = `Lỗi: ${err.message}`;
  }

  console.log(`  Result: ${pass ? "PASS" : "FAIL"} - ${screenshotFile}`);
  return [tcId, tourId, dateDmy, location, priceAdult, priceChild, seats, expected, screenshotFile, pass ? "PASS" : "FAIL"];
}

async function runAllTests(filename, folderName) {
  const testCases = readExcel(filename);
  if (testCases.length === 0) { console.error("No test cases found!"); return; }
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
