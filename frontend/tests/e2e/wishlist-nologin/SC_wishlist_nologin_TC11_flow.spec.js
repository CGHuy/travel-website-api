const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC11-flow");
const URL = "http://localhost:3000";
const DB_CONFIG = (() => {
	const candidates = [
		path.resolve(__dirname, "../../../../.env"),
		path.resolve(__dirname, "../../../../backend/.env"),
	];
	let envPath = candidates.find((p) => fs.existsSync(p));
	if (!envPath) throw new Error("Không tìm thấy file .env");
	const env = fs.readFileSync(envPath, "utf-8");
	const get = (k) => {
		const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
		return m ? m[1].trim() : "";
	};
	return {
		host: get("DB_HOST") || "localhost",
		user: get("DB_USER") || "root",
		password: get("DB_PASSWORD") || "",
		database: get("DB_NAME") || "db_viet_tour",
		port: parseInt(get("DB_PORT")) || 3306,
	};
})();
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ trước khi chạy
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	// ====================================================================
	// RESET DB: chạy seed.sql trước khi test
	// ====================================================================
	console.log("\n========== RESET DATABASE ==========");
	let connection;
	try {
		connection = await mysql.createConnection(DB_CONFIG);
		const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
		const statements = seedSql
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s && !s.startsWith("--") && !s.startsWith("/*"));
		for (const stmt of statements) {
			try {
				await connection.execute(stmt);
			} catch (err) {
				console.log(`  (skip): ${err.message.substring(0, 80)}`);
			}
		}
		await connection.end();
		connection = null;
		console.log("  \u2705 Database đã reset thành công");
	} catch (err) {
		console.error(`  \u274C Reset DB thất bại: ${err.message}`);
		if (connection) await connection.end().catch(() => {});
		process.exit(1);
	}

	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: ["--start-maximized"],
	});
	const page = await browser.newPage();
	let step = 0;
	const shot = async (name) => {
		step++;
		try {
			await page.screenshot({
				path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
				fullPage: true,
			});
			console.log(`  >> Đã chụp: ${name}.png`);
		} catch (e) {
			await sleep(2000);
			await page.screenshot({
				path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
				fullPage: true,
			});
			console.log(`  >> Đã chụp (lần 2): ${name}.png`);
		}
	};

	try {
		// ====================================================================
		// BƯỚC 1: VÀO TRANG CHI TIẾT TOUR (CHƯA LOGIN)
		// ====================================================================
		console.log("\n========== BƯỚC 1: CHI TIẾT TOUR (CHƯA LOGIN) ==========");
		// Xóa token để đảm bảo chưa đăng nhập
		await page.goto(`${URL}/detail-tour?id=4`, {
			waitUntil: "networkidle0",
		});
		await page.evaluate(() => localStorage.removeItem("token"));
		await page.reload({ waitUntil: "networkidle0" });
		await page.waitForSelector("#tour-name");
		await sleep(1500);
		await shot("01-detail-not-logged");

		const tourName = await page
			.$eval("#tour-name", (el) => el.textContent)
			.catch(() => "N/A");
		console.log(`  -> Tour: ${tourName}`);

		// ====================================================================
		// BƯỚC 2: CLICK NÚT TRÁI TIM (YÊU THÍCH) - CHƯA LOGIN
		// ====================================================================
		console.log("\n========== BƯỚC 2: CLICK HEART (CHƯA LOGIN) ==========");
		const heartBtn = await page.$(".btn-action-round.love");
		if (!heartBtn) throw new Error("Không tìm thấy nút yêu thích");
		console.log('  -> Click nút yêu thích (chưa login)...');
		await heartBtn.click();
		await sleep(1500);

		// Kiểm tra toast cảnh báo
		try {
			await page.waitForSelector("#globalToast", { timeout: 3000 });
			await sleep(500);
			const toastText = await page
				.$eval("#globalToastBody", (el) => el.textContent)
				.catch(() => "");
			console.log(`  -> Toast: ${toastText}`);
		} catch (e) {
			console.log("  -> Toast không xuất hiện");
		}
		await shot("02-heart-warning-toast");

		// Chờ redirect sang trang login (code detail-tour.js: setTimeout 2s)
		console.log("  -> Chờ redirect sang trang login...");
		try {
			await page.waitForFunction(
				() => window.location.href.includes("login"),
				{ timeout: 8000 },
			);
			console.log("  -> Đã redirect sang trang đăng nhập");
		} catch (e) {
			console.log("  -> Không redirect được, kiểm tra URL hiện tại...");
		}
		await sleep(1000);
		await shot("03-redirect-login");

		// ====================================================================
		// BƯỚC 3: ĐĂNG NHẬP
		// ====================================================================
		console.log("\n========== BƯỚC 3: ĐĂNG NHẬP ==========");
		await page.waitForSelector("#loginForm", { timeout: 10000 });
		await sleep(500);
		console.log("  -> Nhập tài khoản...");
		await page.type("#username", "nam@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		console.log("  -> Đã click Đăng nhập, chờ xử lý...");
		await page.waitForFunction(() => localStorage.getItem("token") !== null, {
			timeout: 8000,
		});
		await sleep(1500);

		// Sau login, redirect về trang chi tiết tour (do param redirect)
		const afterLoginUrl = page.url();
		console.log(`  -> URL sau login: ${afterLoginUrl.substring(0, 80)}...`);
		await shot("04-after-login");

		// ====================================================================
		// BƯỚC 4: CLICK HEART LẦN NỮA (ĐÃ LOGIN) → THÊM WISHLIST
		// ====================================================================
		console.log("\n========== BƯỚC 4: CLICK HEART (ĐÃ LOGIN) ==========");
		// Đợi trang detail tour load lại
		try {
			await page.waitForSelector("#tour-name", { timeout: 10000 });
		} catch (e) {
			// Nếu không ở detail tour, điều hướng lại
			console.log("  -> Không ở detail tour, điều hướng lại...");
			await page.goto(`${URL}/detail-tour?id=4`, {
				waitUntil: "networkidle0",
			});
		}
		await sleep(1500);

		const heartBtn2 = await page.$(".btn-action-round.love");
		if (!heartBtn2) throw new Error("Không tìm thấy nút yêu thích");
		console.log('  -> Click nút yêu thích (đã login)...');
		await heartBtn2.click();
		await sleep(1500);

		// Kiểm tra icon chuyển sang fa-solid
		const heartIcon = await heartBtn2.$("i");
		const isSolid = await page.evaluate(
			(el) => el.classList.contains("fa-solid"),
			heartIcon,
		);
		const heartColor = await page.evaluate(
			(el) => getComputedStyle(el).color,
			heartIcon,
		);
		console.log(`  -> Icon solid: ${isSolid}, color: ${heartColor}`);

		// Kiểm tra toast thành công
		try {
			await page.waitForSelector("#globalToast", { timeout: 3000 });
			await sleep(500);
			const toastText = await page
				.$eval("#globalToastBody", (el) => el.textContent)
				.catch(() => "");
			console.log(`  -> Toast: ${toastText}`);
		} catch (e) {
			console.log("  -> Toast không xuất hiện");
		}
		await shot("05-wishlist-added");

		// ====================================================================
		// BƯỚC 5: VÀO DANH SÁCH YÊU THÍCH
		// ====================================================================
		console.log("\n========== BƯỚC 5: TRANG YÊU THÍCH ==========");
		await page.goto(`${URL}/favorite`, { waitUntil: "networkidle0" });
		await sleep(2000);

		const favCards = await page.$$(".favorite-card");
		console.log(`  -> Số tour yêu thích: ${favCards.length}`);
		if (favCards.length === 0) {
			const noFav = await page.$("#no-favorites:not(.d-none)");
			if (noFav) throw new Error("Tour không được thêm vào wishlist");
		}
		await shot("06-favorite-page");

		// ====================================================================
		// TỔNG KẾT
		// ====================================================================
		console.log("\n============================================");
		console.log(`✅ HOÀN TẤT KIỂM THỬ - ${step} ảnh đã lưu`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		console.log("Trình duyệt sẽ đóng sau 10 giây...");
		await sleep(10000);
	} catch (err) {
		console.error(`\n❌ LỖI: ${err.message}`);
		try {
			await page.screenshot({
				path: path.join(DIR, "error.png"),
				fullPage: true,
			});
			console.log("  >> Đã chụp ảnh lỗi");
		} catch (e) {}
	} finally {
		try {
			await browser.close();
		} catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
