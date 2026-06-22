const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC10-remove");
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
		// BƯỚC 1: ĐĂNG NHẬP
		// ====================================================================
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
		await page.goto(`${URL}/pages/auth/login.html`, {
			waitUntil: "networkidle0",
		});
		await page.waitForSelector("#loginForm");
		await sleep(1000);
		console.log("  -> Nhập tài khoản...");
		await page.type("#username", "nam@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await shot("01-login-page");
		await page.click('button[type="submit"]');
		console.log("  -> Đã click Đăng nhập, chờ xử lý...");
		await page.waitForFunction(() => localStorage.getItem("token") !== null, {
			timeout: 8000,
		});
		await page
			.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })
			.catch(() => {});
		await sleep(1000);
		await shot("02-login-success");

		// ====================================================================
		// BƯỚC 2: VÀO DANH SÁCH YÊU THÍCH
		// ====================================================================
		console.log("\n========== BƯỚC 2: TRANG YÊU THÍCH ==========");
		await page.goto(`${URL}/favorite`, { waitUntil: "networkidle0" });
		await sleep(2000);

		// Đợi favorite-list render xong
		await page.waitForSelector(".favorite-card", { timeout: 10000 });
		await shot("03-favorite-page");

		const favCards = await page.$$(".favorite-card");
		console.log(`  -> Số tour yêu thích: ${favCards.length}`);
		if (favCards.length === 0) throw new Error("Không có tour yêu thích để xóa");

		// Lưu tour_id trước để dùng sau khi xóa
		const targetTourId = await page.$eval(
			".favorite-card",
			(el) => el.dataset.tourId,
		);
		console.log(`  -> Tour ID cần xóa: ${targetTourId}`);

		// ====================================================================
		// BƯỚC 3: CLICK NÚT TRÁI TIM (XÓA)
		// ====================================================================
		console.log("\n========== BƯỚC 3: CLICK XÓA ==========");
		const removeBtn = await page.$(".remove-favorite-btn");
		if (!removeBtn) throw new Error("Không tìm thấy nút xóa yêu thích");
		console.log("  -> Click nút trái tim xóa...");
		await removeBtn.click();
		await sleep(1000);

		// ====================================================================
		// BƯỚC 4: CHỜ DIALOG XÁC NHẬN
		// ====================================================================
		console.log("\n========== BƯỚC 4: DIALOG XÁC NHẬN ==========");
		try {
			await page.waitForSelector("#globalConfirmModal.show", { timeout: 5000 });
			console.log("  -> Dialog xác nhận đã hiện");
		} catch (e) {
			console.log("  -> Dialog không hiện, có thể confirm không cần thiết");
		}
		await sleep(500);
		await shot("04-confirm-dialog");

		// ====================================================================
		// BƯỚC 5: CLICK "ĐỒNG Ý"
		// ====================================================================
		console.log("\n========== BƯỚC 5: XÁC NHẬN XÓA ==========");
		const confirmBtn = await page.$("#globalConfirmSubmit");
		if (confirmBtn) {
			console.log('  -> Click "Đồng ý"...');
			await confirmBtn.click();
		} else {
			console.log("  -> Không tìm thấy nút Đồng ý, bỏ qua");
		}

		// Chờ dialog đóng
		await sleep(1000);

		// ====================================================================
		// BƯỚC 6: KIỂM TRA KẾT QUẢ XÓA
		// ====================================================================
		console.log("\n========== BƯỚC 6: KIỂM TRA KẾT QUẢ ==========");
		// Chờ animation + DOM update
		await sleep(2000);

		// Kiểm tra toast
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

		// Đếm lại số card
		const remainingCards = await page.$$(".favorite-card");
		console.log(
			`  -> Số tour còn lại: ${remainingCards.length} (giảm ${favCards.length - remainingCards.length})`,
		);
		await shot("05-after-remove");

		// ====================================================================
		// BƯỚC 7: VÀO CHI TIẾT TOUR VỪA XÓA
		// ====================================================================
		console.log("\n========== BƯỚC 7: KIỂM TRA ICON TIM ==========");
		const detailUrl = `/pages/user/detail-tour.html?id=${targetTourId}`;
		console.log(`  -> Đi đến: ${detailUrl}`);
		await page.goto(detailUrl.startsWith("http") ? detailUrl : `${URL}${detailUrl}`, {
			waitUntil: "networkidle0",
		});
		await sleep(2000);

		// Kiểm tra icon trái tim là fa-regular (không fill)
		const heartIcon = await page.$(".btn-action-round.love i");
		if (heartIcon) {
			const isRegular = await page.evaluate(
				(el) => el.classList.contains("fa-regular"),
				heartIcon,
			);
			const isSolid = await page.evaluate(
				(el) => el.classList.contains("fa-solid"),
				heartIcon,
			);
			console.log(`  -> Icon fa-regular: ${isRegular}, fa-solid: ${isSolid}`);
		}
		await shot("06-detail-heart-regular");

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
