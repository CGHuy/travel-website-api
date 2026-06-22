const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const DIR = path.resolve(__dirname, "screenshots", "TC03-departed-booking-no-cancel-btn");
const BASE_URL = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let SCREEN_W = 1366, SCREEN_H = 768;
try {
	const raw = execSync(
		'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height"',
		{ encoding: "utf8", timeout: 5000 },
	);
	const parts = raw.trim().split(/\r?\n/).filter(Boolean);
	if (parts.length >= 2) {
		SCREEN_W = parseInt(parts[0]) || SCREEN_W;
		SCREEN_H = parseInt(parts[1]) || SCREEN_H;
	}
} catch (e) {}
console.log(`📐 Màn hình: ${SCREEN_W}x${SCREEN_H}`);

if (fs.existsSync(DIR)) fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1920, height: 1080 },
		args: ["--start-maximized"],
	});
	const page = await browser.newPage();
	let step = 0;
	const shot = async (name) => {
		step++;
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await page.setViewport({ width: SCREEN_W, height: SCREEN_H }).catch(() => {});
				await page.screenshot({
					path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
					fullPage: true,
				});
				console.log(`  >> Đã chụp: ${name}.png`);
				return;
			} catch (e) {
				const size = await page.evaluate(() => ({
					w: window.screen.availWidth,
					h: window.screen.availHeight,
				})).catch(() => ({ w: 0, h: 0 }));
				if (size.w > 0) { SCREEN_W = size.w; SCREEN_H = size.h; }
				await page.setViewport({ width: SCREEN_W, height: SCREEN_H }).catch(() => {});
				console.log(`  >> (thử ${attempt + 1}) ${e.message.substring(0, 60)}`);
				await sleep(2000);
			}
		}
	};

	try {
		// Bước 1: Đăng nhập nhung (user có booking 80 đã khởi hành)
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
		await page.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "domcontentloaded" });
		await page.waitForSelector("#loginForm");
		await page.type("#username", "nhung@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);
		await shot("01-login-success");

		// Bước 2: Vào lịch sử đặt tour
		console.log("\n========== BƯỚC 2: LỊCH SỬ ĐẶT TOUR ==========");
		await page.goto(`${BASE_URL}/pages/user/bookings-history.html`, { waitUntil: "domcontentloaded" });
		await page.waitForFunction(
			() => document.querySelectorAll(".booking-item").length > 0,
			{ timeout: 10000 },
		);
		await sleep(1000);
		await shot("02-booking-history");

		// Bước 3: Vào chi tiết booking 80 (đã khởi hành 18/04/2026)
		console.log("\n========== BƯỚC 3: CHI TIẾT BOOKING ĐÃ KHỞI HÀNH ==========");
		await page.goto(`${BASE_URL}/pages/user/booking-details.html?id=80`, {
			waitUntil: "domcontentloaded",
			timeout: 20000,
		});
		await page.waitForSelector("#booking-actions", { timeout: 8000 });
		await sleep(2000);

		// Kiểm tra KHÔNG có nút "Yêu cầu hủy"
		const cancelBtn = await page.$("#booking-actions .btn-outline-danger");
		if (!cancelBtn) {
			console.log('  ✅ Không có nút "Yêu cầu hủy" (đúng - booking đã khởi hành)');
		} else {
			const btnText = await page.evaluate((el) => el.textContent, cancelBtn);
			console.log(`  ⚠️ Nút "Yêu cầu hủy" vẫn hiển thị: "${btnText.trim()}" (sai)`);
		}

		await shot("03-booking-detail-departed");

		console.log("\n============================================");
		console.log(`✅ TC03 DEPARTED BOOKING - ${step} ảnh đã lưu`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		await sleep(5000);
	} catch (err) {
		console.error(`\n❌ LỖI: ${err.message}`);
		try { await page.screenshot({ path: path.join(DIR, "error.png"), fullPage: true }); } catch (e) {}
	} finally {
		try { await browser.close(); } catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
