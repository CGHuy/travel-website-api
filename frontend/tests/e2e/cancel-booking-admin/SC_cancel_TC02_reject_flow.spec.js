const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");
const { execSync } = require("child_process");

const DIR = path.resolve(__dirname, "screenshots", "TC02-reject-flow");
const BASE_URL = "http://localhost:3000";
const DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "12345",
	database: "db_viet_tour",
	port: 3307,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Màn hình
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

// Xoá screenshot cũ + DB reset
if (fs.existsSync(DIR)) fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	// RESET DB
	console.log("\n========== RESET DATABASE ==========");
	let connection;
	try {
		connection = await mysql.createConnection(DB_CONFIG);
		const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
		const clean = seedSql
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/--[^\n]*/g, "")
			.replace(/\n\s*\n/g, "\n");
		const statements = clean.split(";").map((s) => s.trim()).filter(Boolean);
		for (const stmt of statements) {
			try { await connection.execute(stmt); } catch (err) {
				console.log(`  (skip): ${err.message.substring(0, 80)}`);
			}
		}
		await connection.end();
		connection = null;
		console.log("  ✅ Database đã reset thành công");
	} catch (err) {
		console.error(`  ❌ Reset DB thất bại: ${err.message}`);
		if (connection) await connection.end().catch(() => {});
		process.exit(1);
	}

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

	let userContext, adminContext;
	let userPage, adminPage;

	try {
		// ====================================================================
		// PHASE 1: Step 1 - User (nam) gửi yêu cầu hủy booking 88
		// ====================================================================
		console.log("\n========== PHASE 1: NGƯỜI DÙNG GỬI YÊU CẦU HỦY ==========");
		userContext = await browser.createBrowserContext();
		userPage = await userContext.newPage();

		// Đăng nhập nam
		await userPage.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "domcontentloaded" });
		await userPage.waitForSelector("#loginForm");
		await userPage.type("#username", "nam@gmail.com", { delay: 30 });
		await userPage.type("#password", "123456", { delay: 30 });
		await userPage.click('button[type="submit"]');
		await userPage.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await userPage.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);

		// Vào chi tiết booking 88
		await userPage.goto(`${BASE_URL}/pages/user/booking-details.html?id=88`, { waitUntil: "domcontentloaded" });
		try {
			await userPage.waitForSelector("#booking-actions", { timeout: 8000 });
		} catch (e) {}
		await sleep(2000);
		await shot(userPage, "01-user-booking-detail");

		// Click "Yêu cầu hủy"
		const cancelBtn = await userPage.$("#booking-actions .btn-outline-danger");
		if (cancelBtn) {
			await cancelBtn.click();
			await sleep(1500);
			// Đọc thông tin modal
			const modalInfo = await userPage.evaluate(() => {
				const g = (id) => (document.getElementById(id) || {}).textContent || "N/A";
				return {
					depDate: g("modal-dep-date"),
					daysLeft: g("modal-days-left"),
					totalPrice: g("modal-total-price"),
					penalty: g("modal-penalty-percent"),
					refund: g("modal-refund-amount"),
				};
			});
			console.log(`  => Ngày KH: ${modalInfo.depDate} | Còn: ${modalInfo.daysLeft} | Tổng: ${modalInfo.totalPrice} | Phí: ${modalInfo.penalty} | Hoàn: ${modalInfo.refund}`);
			await shot(userPage, "02-user-cancel-modal");

			// Xác nhận hủy
			const confirmBtn = await userPage.$("#confirm-cancel-btn");
			if (confirmBtn) {
				await confirmBtn.click();
				console.log("  -> Đã click Chắc chắn Hủy");
				// Chờ reload sau khi thành công
				await userPage.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
				await sleep(2000);

				// Kiểm tra booking chuyển pending
				const statusText = await userPage.$eval("#booking-status", (el) => el.textContent).catch(() => "N/A");
				console.log(`  => Trạng thái booking: ${statusText}`);
				await shot(userPage, "03-user-cancel-success");
			}
		}

		// ====================================================================
		// PHASE 2: Steps 2-6 - Admin (booking-staff) từ chối yêu cầu hủy
		// ====================================================================
		console.log("\n\n========== PHASE 2: ADMIN TỪ CHỐI YÊU CẦU HỦY ==========");
		adminContext = await browser.createBrowserContext();
		adminPage = await adminContext.newPage();

		// Step 2: Đăng nhập admin booking-staff
		console.log("\n--- Step 2: Đăng nhập admin ---");
		await adminPage.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "domcontentloaded" });
		await adminPage.waitForSelector("#loginForm");
		await adminPage.type("#username", "booking-staff@gmail.com", { delay: 30 });
		await adminPage.type("#password", "123456", { delay: 30 });
		await adminPage.click('button[type="submit"]');
		await adminPage.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await adminPage.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);
		await shot(adminPage, "04-admin-login");

		// Step 3: Vào admin booking detail (SPA dashboard)
		console.log("\n--- Step 3: Admin booking detail ---");
		await adminPage.goto(`${BASE_URL}/pages/admin/dashboard.html?page=booking-details&id=88`, { waitUntil: "domcontentloaded" });
		await sleep(3000);
		await shot(adminPage, "05-admin-booking-detail");

		// Kiểm tra nút "Phê duyệt hủy tour & Hoàn tiền"
		const showModalBtn = await adminPage.$("#btn-show-cancel-modal");
		if (showModalBtn) {
			console.log("  ✅ Tìm thấy nút Phê duyệt hủy tour & Hoàn tiền");

			// Step 4: Click phê duyệt → modal
			console.log("\n--- Step 4: Modal phê duyệt ---");
			await showModalBtn.click();
			await sleep(1500);

			const adminModalInfo = await adminPage.evaluate(() => {
				const g = (id) => (document.getElementById(id) || {}).textContent || "N/A";
				return {
					reqDate: g("modal-req-date"),
					daysLeft: g("modal-admin-days-left"),
					penalty: g("modal-admin-penalty-percent"),
					refund: g("modal-refund-amount"),
				};
			});
			console.log(`  => Ngày yêu cầu: ${adminModalInfo.reqDate} | Còn: ${adminModalInfo.daysLeft} | Phí: ${adminModalInfo.penalty} | Hoàn: ${adminModalInfo.refund}`);
			await shot(adminPage, "06-admin-cancel-modal");

			// Step 5: Click "Từ chối yêu cầu"
			console.log("\n--- Step 5: Từ chối yêu cầu ---");
			const rejectBtn = await adminPage.$("#btn-reject-cancel");
			if (rejectBtn) {
				await rejectBtn.click();
				await sleep(1000);

				// Step 6: Xác nhận từ chối → global confirm dialog
				console.log("\n--- Step 6: Xác nhận từ chối ---");
				try {
					await adminPage.waitForSelector("#globalConfirmModal.show, #globalConfirmModal:not([style*='display: none'])", { timeout: 5000 });
				} catch (e) {
					await sleep(2000);
				}
				await shot(adminPage, "07-admin-reject-confirm");

				const confirmRejectBtn = await adminPage.$("#globalConfirmSubmit");
				if (confirmRejectBtn) {
					await confirmRejectBtn.click();
					console.log("  -> Đã click Đồng ý");
					// Chờ reload sau khi từ chối thành công
					await adminPage.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
					await sleep(2000);
					await shot(adminPage, "08-admin-reject-success");

					// Verify booking về confirmed
					const bookingTitle = await adminPage.$eval("#booking-id-title", (el) => el.textContent).catch(() => "N/A");
					console.log(`  => Trạng thái booking: ${bookingTitle}`);

					const cancelArea = await adminPage.$("#cancellation-action-area");
					let cancelDisplay = "N/A";
					if (cancelArea) {
						cancelDisplay = await cancelArea.evaluate((el) => window.getComputedStyle(el).display);
					}
					console.log(`  => Khu vực hủy: ${cancelDisplay}`);
					if (cancelDisplay === "none") console.log("  ✅ Khu vực phê duyệt hủy đã ẩn (booking về confirmed)");
				}
			}
		}

		// ====================================================================
		// PHASE 3: Step 7 - User kiểm tra lại
		// ====================================================================
		console.log("\n\n========== PHASE 3: USER KIỂM TRA LẠI ==========");
		await userPage.goto(`${BASE_URL}/pages/user/booking-details.html?id=88`, { waitUntil: "domcontentloaded" });
		try {
			await userPage.waitForSelector("#booking-actions", { timeout: 8000 });
		} catch (e) {}
		await sleep(2000);
		await shot(userPage, "09-user-booking-confirmed");

		const userStatus = await userPage.$eval("#booking-status", (el) => el.textContent).catch(() => "N/A");
		console.log(`  => User - Trạng thái booking: ${userStatus}`);
		if (userStatus.includes("Đã xác nhận")) console.log("  ✅ Booking đã trở về 'Đã xác nhận'");

		const userCancelBtn = await userPage.$("#booking-actions .btn-outline-danger");
		if (userCancelBtn) {
			const btnText = await userPage.evaluate((el) => el.textContent, userCancelBtn);
			console.log(`  ✅ Nút 'Yêu cầu hủy' xuất hiện lại: ${btnText.trim()}`);
		}
		await shot(userPage, "10-user-cancel-btn-again");

		console.log("\n============================================");
		console.log(`✅ TC02 REJECT FLOW HOÀN TẤT - ${step} ảnh đã lưu`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		console.log("Trình duyệt sẽ đóng sau 10 giây...");
		await sleep(10000);
	} catch (err) {
		console.error(`\n❌ LỖI: ${err.message}`);
		try {
			const p = userPage || adminPage || (await browser.newPage());
			await p.screenshot({ path: path.join(DIR, "error.png"), fullPage: true });
		} catch (e) {}
	} finally {
		try { await browser.close(); } catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
