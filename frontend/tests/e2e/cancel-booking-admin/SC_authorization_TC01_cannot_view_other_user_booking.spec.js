const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const DIR = path.resolve(__dirname, "screenshots", "TC01-cannot-view-other-booking");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Phát hiện độ phân giải màn hình thật qua PowerShell
let SCREEN_W = 1366,
	SCREEN_H = 768;
try {
	const cp = require("child_process");
	const raw = cp
		.execSync(
			`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height"`,
			{ encoding: "utf8", timeout: 5000 },
		)
		.trim();
	const parts = raw.split("\n").filter(Boolean);
	if (parts.length >= 2) {
		SCREEN_W = parseInt(parts[0].trim(), 10);
		SCREEN_H = parseInt(parts[1].trim(), 10);
	}
} catch (e) {}

// Xoá screenshot cũ
if (fs.existsSync(DIR)) fs.rmSync(DIR, { recursive: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1920, height: 1080 },
		args: ["--start-maximized"],
	});
	let step = 0;
	const shot = async (page, name) => {
		step++;
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await page
					.setViewport({ width: SCREEN_W, height: SCREEN_H })
					.catch(() => {});
				await page.screenshot({
					path: path.join(
						DIR,
						`${String(step).padStart(2, "0")}-${name}.png`,
					),
					fullPage: true,
				});
				console.log(`  >> Đã chụp: ${name}.png`);
				return;
			} catch (e) {
				const size = await page
					.evaluate(() => ({
						w: window.screen.availWidth,
						h: window.screen.availHeight,
					}))
					.catch(() => ({ w: 0, h: 0 }));
				if (size.w > 0) {
					SCREEN_W = size.w;
					SCREEN_H = size.h;
				}
				await page
					.setViewport({ width: SCREEN_W, height: SCREEN_H })
					.catch(() => {});
				console.log(
					`  >> (thử ${attempt + 1}) ${e.message.substring(0, 60)}`,
				);
				await sleep(2000);
			}
		}
	};

	const page = await browser.newPage();

	try {
		// ====================================================================
		// Bước 1: Đăng nhập bằng tài khoản Nam
		// ====================================================================
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP USER ==========");
		await page.goto(`${BASE_URL}/pages/auth/login.html`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForSelector("#username", { timeout: 8000 });
		await page.type("#username", "nam@gmail.com", { delay: 20 });
		await page.type("#password", "123456", { delay: 20 });
		await shot(page, "01-login-filled");

		await page.click('button[type="submit"]');
		await page.waitForFunction(
			() => localStorage.getItem("token") !== null,
			{ timeout: 8000 },
		);
		await sleep(1500);
		await shot(page, "02-login-success");

		// ====================================================================
		// Bước 2: Vào lịch sử đặt tour
		// ====================================================================
		console.log("\n========== BƯỚC 2: LỊCH SỬ ĐẶT TOUR ==========");
		await page.goto(`${BASE_URL}/pages/user/bookings-history.html`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForFunction(
			() => {
				const items = document.querySelectorAll(".booking-item");
				return items.length > 0;
			},
			{ timeout: 10000 },
		);
		await sleep(1500);
		await shot(page, "03-booking-history");

		// ====================================================================
		// Bước 3: Nhập trực tiếp URL chi tiết booking của người khác
		// ====================================================================
		console.log(
			"\n========== BƯỚC 3: TRUY CẬP TRÁI PHÉP BOOKING NGƯỜI KHÁC ==========",
		);
		await page.goto(`${BASE_URL}/pages/user/booking-details.html?id=5`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForFunction(
			() => {
				const content = document.getElementById("booking-detail-content");
				if (!content) return false;
				const h4 = content.querySelector("h4");
				return h4 && h4.textContent.includes("Lỗi khi lấy thông tin");
			},
			{ timeout: 8000 },
		);
		await sleep(1000);
		await shot(page, "04-error-other-booking");

		// Kiểm tra có nút "Quay lại lịch sử"
		const backBtn = await page.$('a[href="bookings-history.html"]');
		if (backBtn) {
			console.log('  ✅ Có nút "Quay lại lịch sử"');
		} else {
			console.log('  ⚠️ Không tìm thấy nút "Quay lại lịch sử"');
		}

		console.log("\n========== HOÀN TẤT ==========");
	} catch (err) {
		console.error(`\n❌ Lỗi: ${err.message}`);
	} finally {
		await browser.close();
	}
})();
