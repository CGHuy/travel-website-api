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

function getTimestamp() {
    return Date.now().toString().slice(-6);
}

// Thay thế các placeholder trong Excel bằng dữ liệu động (email/phone unique, email độ dài biên)
function prepareData(row) {
    const ts = getTimestamp();
    return row.map((cell) => {
        if (typeof cell !== "string") return cell;
        return cell
            .replace("_UNIQUE_EMAIL_", `test${ts}@example.com`)
            .replace("_UNIQUE_PHONE_", `09${ts}01`)
            .replace("_EMAIL_49_", `a${"a".repeat(42)}@b.c`)
            .replace("_EMAIL_50_", `a${"a".repeat(43)}@b.c`)
            .replace("_EMAIL_51_", `a${"a".repeat(44)}@b.c`);
    });
}

// Chụp ảnh màn hình sau mỗi test case
async function screenshot(page, folder, filename) {
    const dir = path.join(SCREENSHOT_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, filename) });
}

// Điều hướng đến trang đăng ký, đảm bảo form đã load
async function navigateToRegister(page) {
    await page.goto("about:blank", { waitUntil: "load", timeout: TIMEOUT }).catch(() => {});
    await sleep(300);
    await page.goto(`${BASE_URL}/pages/auth/register.html`, { waitUntil: "networkidle2", timeout: TIMEOUT });
    await page.waitForSelector("#registerForm", { timeout: TIMEOUT });
    await sleep(500);
}

// Đọc file Excel, bỏ qua dòng header và dòng rỗng
function readExcel(filename) {
    const filePath = path.join(EXCEL_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    const wb = XLSX.readFile(filePath);
    return XLSX.utils
        .sheet_to_json(wb.Sheets["Test Cases"], { header: 1 })
        .slice(1)
        .filter((r) => r[0]);
}

// Cấu hình header và độ rộng cột cho file Excel đầu ra
const EXCEL_HEADERS = ["TC", "Họ và tên", "Số điện thoại", "Email", "Mật khẩu", "Xác nhận MK", "Kết quả mong đợi", "Kết quả thực tế", "Pass/Fail"];
const EXCEL_COLS = [{ wch: 10 }, { wch: 21 }, { wch: 11 }, { wch: 51 }, { wch: 21 }, { wch: 21 }, { wch: 60 }, { wch: 30 }, { wch: 10 }];

// Ghi kết quả test ra file Excel
function writeExcel(filename, data) {
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...data]);
    ws["!cols"] = EXCEL_COLS;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
    XLSX.writeFile(wb, path.join(EXCEL_DIR, filename));
}

// Câu lệnh kết nối MySQL để restore DB và xoá user test
const MYSQL = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe" -u root -p13052005 db_viet_tour`;

// Khôi phục database từ file backup trước khi chạy test
function restoreDB() {
    const sqlFile = path.join(__dirname, "..", "..", "db_vietravel_KTPM.sql");
    if (!fs.existsSync(sqlFile)) {
        console.error(`Backup not found: ${sqlFile}`);
        return;
    }
    console.log("\nRestoring database from backup...");
    execSync(`cmd.exe /c type "${sqlFile}" | ${MYSQL}`, { stdio: "inherit", timeout: 120000 });
    console.log("Database restored.");
}

// Xoá user test sau khi đăng ký thành công để tránh ảnh hưởng test case sau
function deleteTestUser(email) {
    if (!email) return;
    const tmpFile = path.join(__dirname, `_del_${Date.now()}.sql`);
    fs.writeFileSync(tmpFile, `DELETE FROM users WHERE email='${email.replace(/'/g, "''")}';\n`, "utf8");
    try {
        execSync(`cmd.exe /c type "${tmpFile}" | ${MYSQL}`, { stdio: "pipe", timeout: 10000 });
    } catch (e) {
        // ignore
    } finally {
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {}
    }
}

// Set giá trị cho input, xoá class validation cũ và dispatch event 'input' để kích hoạt validate client
async function setFieldValue(page, selector, value) {
    const el = await page.waitForSelector(selector, { timeout: TIMEOUT });
    await el.evaluate((e) => {
        e.value = "";
        e.classList.remove("is-invalid", "is-valid");
    });
    if (value) {
        await el.evaluate((e, text) => {
            e.value = text;
            e.dispatchEvent(new Event("input", { bubbles: true }));
        }, value);
        await sleep(50);
    }
}

// Trích xuất cụm lỗi từ chuỗi kỳ vọng (hỗ trợ quote đơn, quote kép, hoặc dạng "Hiển thị lỗi: ...")
function extractErrorPhrases(text) {
    let phrases = text.match(/'([^']+)'/g)?.map((p) => p.replace(/'/g, "")) || [];
    if (phrases.length === 0) {
        phrases = text.match(/"([^"]+)"/g)?.map((p) => p.replace(/"/g, "")) || [];
    }
    if (phrases.length === 0) {
        let cleaned = text
            .replace(/^(Hiển thị (lỗi|thông báo)[^:]*:\s*)/i, "")
            .replace(/[.!]+$/g, "")
            .trim();
        if (cleaned) phrases = [cleaned];
    }
    return phrases;
}

// Chuẩn hoá chuỗi để so khớp linh hoạt (xoá dấu câu cuối, chuẩn hoá khoảng trắng, lowercase, sửa lỗi chính tả phổ biến)
function normalizeForMatch(text) {
    return text
        .replace(/[.!]+$/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/họ\s+tên/g, "họ và tên")
        .replace(/không\s+đượt/g, "không được");
}

// So sánh lỗi thực tế với kỳ vọng (theo hướng chứa nhau để linh hoạt)
function isErrorMatch(actual, expected) {
    const normActual = normalizeForMatch(actual);
    const normExpected = normalizeForMatch(expected);
    return normActual.includes(normExpected) || normExpected.includes(normActual);
}

// Chạy một test case đơn lẻ
async function runSingleTest(page, testCase, folderName) {
    const [tcId, fullname, phone, email, password, confirmPassword, expected] = prepareData(testCase);
    console.log(`\n>>> Running ${tcId}...`);
    const expectedStr = String(expected || "");
    let pass = false;
    let actualResult = "";
    let screenshotFile = `${tcId}_result.png`;

    try {
        await navigateToRegister(page);

        // Điền dữ liệu vào form
        await setFieldValue(page, "#fullname", fullname);
        await setFieldValue(page, "#phone", phone);
        await setFieldValue(page, "#email", email);
        await setFieldValue(page, "#password", password);
        await setFieldValue(page, "#confirmPassword", confirmPassword);

        await sleep(200);

        // Gửi form bằng requestSubmit() để trigger đúng sự kiện submit của trình duyệt
        await page.evaluate(() => {
            document.getElementById("registerForm").requestSubmit();
        });

        // Chờ navigation nếu thành công (redirect) hoặc timeout nếu có lỗi
        await Promise.race([page.waitForNavigation({ timeout: 5000 }).catch(() => {}), sleep(2000)]);

        await screenshot(page, folderName, screenshotFile);

        // Lấy trạng thái form sau khi submit: field errors, message, URL, class is-invalid
        const state = await page.evaluate(() => {
            const fieldErrors = {};
            const errorMappings = [
                { id: "fullnameError", field: "fullname" },
                { id: "phoneError", field: "phone" },
                { id: "emailError", field: "email" },
                { id: "passwordError", field: "password" },
                { id: "confirmPasswordError", field: "confirmPassword" },
            ];
            for (const m of errorMappings) {
                const el = document.getElementById(m.id);
                if (el && !el.classList.contains("d-none") && el.textContent.trim()) {
                    fieldErrors[m.field] = el.textContent.trim();
                }
            }
            const msgEl = document.getElementById("registerMessage");
            const messageText = msgEl && !msgEl.classList.contains("d-none") ? msgEl.textContent.trim() : "";
            const currentUrl = window.location.href;
            const isInvalid = !!document.querySelector(".is-invalid");
            return { fieldErrors, messageText, currentUrl, isInvalid };
        });

        console.log(`  DEBUG: fieldErrors=${JSON.stringify(state.fieldErrors)} message="${state.messageText}" url="${state.currentUrl}"`);

        // Xác định PASS/FAIL dựa trên kết quả mong đợi
        if (expectedStr.includes("thành công")) {
            // Trường hợp kỳ vọng thành công: kiểm tra redirect hoặc message thành công
            const redirectedToHome = state.currentUrl.includes("index.html") || state.currentUrl.includes("login.html");
            const hasSuccessMsg = state.messageText.includes("thành công");
            pass = redirectedToHome || hasSuccessMsg;
            actualResult = redirectedToHome ? "Chuyển hướng thành công" : hasSuccessMsg ? state.messageText : "Không có dấu hiệu thành công";
        } else {
            // Trường hợp kỳ vọng lỗi: kiểm tra field errors hoặc message lỗi từ server
            const expectedPhrases = extractErrorPhrases(expectedStr);
            const actualErrors = [...Object.values(state.fieldErrors)];
            if (state.messageText) actualErrors.push(state.messageText);

            if (actualErrors.length > 0 && expectedPhrases.length > 0) {
                pass = expectedPhrases.some((phrase) => actualErrors.some((err) => isErrorMatch(err, phrase)));
                actualResult = actualErrors.join("; ");
            } else {
                actualResult = actualErrors.length > 0 ? actualErrors.join("; ") : "Không có lỗi hiển thị";
                pass = state.isInvalid && expectedPhrases.length === 0;
            }
        }
    } catch (err) {
        console.error(`ERROR in ${tcId}:`, err.message);
        actualResult = `Lỗi: ${err.message}`;
    }

    // Xoá user test nếu đăng ký thành công để không ảnh hưởng test case sau
    if (pass && expectedStr.includes("thành công")) {
        deleteTestUser(email);
    }
    console.log(`  Result: ${pass ? "PASS" : "FAIL"} - ${screenshotFile}`);
    return [tcId, fullname, phone, email, password, confirmPassword, expected, screenshotFile, pass ? "PASS" : "FAIL"];
}

// Hàm chính: đọc Excel, restore DB, chạy lần lượt các test case và ghi kết quả
async function runAllTests(filename, folderName) {
    const testCases = readExcel(filename);
    if (testCases.length === 0) {
        console.error("No test cases found!");
        return;
    }
    console.log(`\n========== Running: ${filename} (${testCases.length} test cases) ==========`);
    restoreDB();

    const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    page.setViewport({ width: 1366, height: 768 });

    try {
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
