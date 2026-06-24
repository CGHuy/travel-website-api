const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");
const XLSX = require("xlsx");

const BASE_URL = "http://localhost:3000";
const TEST_CASE = "TC_ADMIN_USER_05";
const TEST_NAME = TEST_CASE + " - Kiểm thử giá trị biên tạo nhân viên";
const LOG_DIR = path.join(__dirname, "..", "test-results", "logs");
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-results", "screenshots", TEST_CASE);
const INPUT_FILE = path.join(__dirname, "data", "input_data.xlsx");
const RESULT_FILE = path.join(__dirname, "data", "test_results.xlsx");

const DB_CONFIG = (() => {
  const candidates = [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../../.env")];
  const envPath = candidates.find(p => fs.existsSync(p));
  if (!envPath) throw new Error("Không tìm thấy file .env");
  const env = fs.readFileSync(envPath, "utf-8");
  const get = k => { const m = env.match(new RegExp(`^${k}=(.*)$`, "m")); return m ? m[1].trim() : ""; };
  return { host: get("DB_HOST") || "localhost", user: get("DB_USER") || "root", password: get("DB_PASSWORD") || "", database: get("DB_NAME") || "db_viet_tour", port: parseInt(get("DB_PORT")) || 3306 };
})();

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

function readExcelSheets() {
  const wb = XLSX.readFile(INPUT_FILE);
  const rawInput = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  const wbResult = XLSX.readFile(RESULT_FILE);
  const rawResults = XLSX.utils.sheet_to_json(wbResult.Sheets[wbResult.SheetNames[0]]);

  return { rawInput, rawResults, wbResult };
}

function writeResultsToExcel(wbResult, results) {
  const ws = XLSX.utils.json_to_sheet(results);
  ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 50 }, { wch: 10 }, { wch: 40 }, { wch: 22 }];
  wbResult.Sheets[wbResult.SheetNames[0]] = ws;
  XLSX.writeFile(wbResult, RESULT_FILE);
}

(async () => {
  const { rawInput, rawResults, wbResult } = readExcelSheets();
  const testCases = rawResults;

  console.log(`\n========== ${TEST_NAME} ==========`);
  console.log(`Input data: ${rawInput.length} rows, Test cases: ${testCases.length}`);
  console.log(`Input file: ${INPUT_FILE}`);
  console.log(`Result file: ${RESULT_FILE}`);

  // RESET DB
  console.log("\n========== RESET DATABASE ==========");
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    const seedSql = fs.readFileSync(path.join(__dirname, "seed_user_05.sql"), "utf-8");
    const cleanedSql = seedSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const statements = cleanedSql.split(";").map(s => s.trim()).filter(s => s);
    for (const stmt of statements) { try { await connection.execute(stmt); } catch (err) { log(`  (skip): ${err.message.substring(0, 80)}`); } }
    await connection.end(); connection = null;
    log("  \u2705 Database đã reset thành công");
  } catch (err) { console.error(`  \u274C Reset DB thất bại: ${err.message}`); if (connection) await connection.end().catch(() => {}); process.exit(1); }

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    defaultViewport: { width: 1440, height: 800 },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,800"],
  });
  const page = await browser.newPage();

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const inputId = tc.input_id;
    const expectPass = tc.expect_pass === true || tc.expect_pass === "TRUE" || tc.expect_pass === "true";
    const desc = tc.description || "";

    // Lấy input data tương ứng
    const inputRow = rawInput[inputId - 1];
    if (!inputRow) {
      log(`\n❌ Case #${i+1}: input_id=${inputId} không tồn tại trong input_data.xlsx`);
      failed++;
      tc.result = "FAIL";
      tc.error = "Input row not found";
      tc.run_at = new Date().toISOString();
      continue;
    }

    const fullname = inputRow.fullname || "";
    const phone = typeof inputRow.phone === 'number' ? String(inputRow.phone) : (inputRow.phone || "");
    const email = inputRow.email || "";
    const password = inputRow.password || "";
    const confirmPw = inputRow.confirm_pw || "";
    const role = inputRow.role || "";

    log(`\n--- Case #${inputId}: ${desc} ---`);
    log(`  fullname="${fullname.substring(0, 50)}${fullname.length > 50 ? '...' : ''}" phone="${phone}" email="${email}" role="${role}"`);

    try {
      // B1: Login
      await page.goto(BASE_URL + "/pages/auth/login.html", { waitUntil: "networkidle0" });
      await sleep(500);
      await page.$eval("#username", el => el.value = "");
      await page.$eval("#password", el => el.value = "");
      await page.type("#username", "admin@gmail.com");
      await page.type("#password", "123456");
      await page.click("button[type='submit']");
      await sleep(2000);

      // B2: Vào Quản lý User
      await page.goto(BASE_URL + "/pages/admin/dashboard.html?page=user", { waitUntil: "networkidle0" });
      await page.waitForSelector("#userTableBody", { timeout: 15000 });
      await sleep(1000);

      // B3: Mở modal
      const openBtn = await page.waitForSelector("#openCreateStaffBtn", { timeout: 5000 });
      await openBtn.click();
      await page.waitForSelector("#createStaffModal.show", { timeout: 5000 });
      await sleep(300);

      // B4: Chọn role
      if (role === "NV Booking") {
        await page.click("label[for='roleBooking']");
      } else if (role === "NV Tour") {
        await page.click("label[for='roleTour']");
      }
      await sleep(200);

      // B5: Điền form
      await page.$eval("#staffFullname", el => el.value = "");
      await page.$eval("#staffPhone", el => el.value = "");
      await page.$eval("#staffEmail", el => el.value = "");
      await page.$eval("#staffPassword", el => el.value = "");
      await page.$eval("#staffConfirmPassword", el => el.value = "");

      if (fullname) await page.type("#staffFullname", fullname);
      if (phone) await page.type("#staffPhone", phone);
      if (email) await page.type("#staffEmail", email);
      if (password) await page.type("#staffPassword", password);
      if (confirmPw) await page.type("#staffConfirmPassword", confirmPw);
      await sleep(200);

      // B6: Submit
      const saveBtn = await page.waitForSelector("#saveCreateStaffBtn", { timeout: 5000 });
      await saveBtn.click();

      // B7: Kiểm tra kết quả
      let hasToast = false;
      let toastMsg = "";
      let isHtml5Blocked = false;

      try {
        await page.waitForSelector("#actionToast.show", { timeout: 3000 });
        hasToast = true;
        toastMsg = await page.$eval("#actionToastBody", el => el.textContent);
        log("  -> Toast: " + toastMsg.trim());
      } catch {
        isHtml5Blocked = true;
        log("  -> HTML5 validation blocked submit");
      }

      await page.screenshot({ path: shotPath(`case_${String(inputId).padStart(2, '0')}_result.png`), fullPage: true });

      // B8: Xác định PASS/FAIL
      let actualPass = false;
      let reason = "";

      if (hasToast) {
        const isSuccess = toastMsg.includes("thành công") || toastMsg.includes("success") || toastMsg.includes("Success");
        actualPass = isSuccess === expectPass;
        reason = isSuccess ? "Toast: " + toastMsg.trim() : "Toast error: " + toastMsg.trim();
      } else if (isHtml5Blocked) {
        actualPass = !expectPass;
        reason = expectPass ? "HTML5 blocked - expected success" : "HTML5 blocked - caught expected error";
      }

      // DB verify
      if (hasToast && toastMsg.includes("thành công")) {
        try {
          const conn2 = await mysql.createConnection(DB_CONFIG);
          const [rows] = await conn2.query("SELECT id FROM users WHERE email = ?", [email]);
          if (rows.length > 0) log("  -> DB: user created (id=" + rows[0].id + ")");
          else { log("  -> DB WARNING: Toast success but user NOT found!"); actualPass = false; reason = "Toast success but DB has no user"; }
          await conn2.end();
        } catch (err) { log("  -> DB verify error: " + err.message.substring(0, 60)); }
      }

      if (actualPass) {
        log(`✅ Case #${inputId}: PASS - ${reason}`);
        passed++;
      } else {
        log(`❌ Case #${inputId}: FAIL - ${reason}`);
        failed++;
      }

      tc.result = actualPass ? "PASS" : "FAIL";
      tc.error = reason;
      tc.run_at = new Date().toISOString();

    } catch (error) {
      log(`\n❌ Case #${inputId}: ERROR - ${error.message}`);
      failed++;
      tc.result = "ERROR";
      tc.error = error.message.substring(0, 100);
      tc.run_at = new Date().toISOString();
      await page.screenshot({ path: shotPath(`case_${String(inputId).padStart(2, '0')}_error.png`), fullPage: true });
    }

    // Ghi ngay kết quả vào file Excel (phòng crash giữa chừng)
    writeResultsToExcel(wbResult, testCases);

    // Reset DB sau mỗi case
    try {
      const conn2 = await mysql.createConnection(DB_CONFIG);
      const seedSql = fs.readFileSync(path.join(__dirname, "seed_user_05.sql"), "utf-8");
      const cleanedSql = seedSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const statements = cleanedSql.split(";").map(s => s.trim()).filter(s => s);
      for (const stmt of statements) { try { await conn2.execute(stmt); } catch (err) {} }
      await conn2.end();
    } catch (err) {}
  }

  // Ghi kết quả vào file Excel
  writeResultsToExcel(wbResult, testCases);
  log("\n\u2705 Results written to: " + RESULT_FILE);

  // TỔNG KẾT
  console.log(`\n${"=".repeat(60)}`);
  console.log(`KẾT QUẢ ${TEST_NAME}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Tổng: ${testCases.length} | PASS: ${passed} | FAIL: ${failed}`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
