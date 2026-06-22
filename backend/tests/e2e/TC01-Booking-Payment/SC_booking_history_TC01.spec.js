const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots");
const BASE_URL = "http://localhost:3000";
const DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "12345",
	database: "db_viet_tour",
	port: 3306,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitForImages = async (page) => {
	try {
		await page.waitForFunction(() => {
			const imgs = document.querySelectorAll("img");
			if (imgs.length === 0) return true;
			const loaded = Array.from(imgs).filter((img) => img.complete && img.naturalWidth > 0);
			const failed = Array.from(imgs).filter((img) => img.complete && img.naturalWidth === 0);
			return loaded.length + failed.length === imgs.length;
		}, { timeout: 45000 });
	} catch (e) {
		const imgCount = await page.evaluate(() => document.querySelectorAll("img").length);
		const loadedCount = await page.evaluate(() => {
			const imgs = document.querySelectorAll("img");
			return Array.from(imgs).filter((img) => img.complete && img.naturalWidth > 0).length;
		});
		console.log(`  ⚠️ Chờ ảnh timeout (${loadedCount}/${imgCount} ảnh), vẫn chụp...`);
	}
};

if (fs.existsSync(DIR)) {
	fs.rmSync(DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	// ====================================================================
	// RESET DB
	// ====================================================================
	console.log("\n========== RESET DATABASE ==========");
	let connection;
	try {
		connection = await mysql.createConnection(DB_CONFIG);
		const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
		const statements = seedSql
			.split("\n")
			.filter(l => !l.trim().startsWith("--") && !l.trim().startsWith("/*"))
			.join("\n")
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s);
		for (const stmt of statements) {
			try { await connection.query(stmt); }
			catch (err) { console.log(`  (skip): ${err.message.substring(0, 80)}`); }
		}
		await connection.end();
		connection = null;
		console.log("  ✅ Database đã reset thành công");
	} catch (err) {
		console.error(`  ❌ Reset DB thất bại: ${err.message}`);
		if (connection) await connection.end().catch(() => {});
		process.exit(1);
	}

	// ====================================================================
	// Khởi tạo browser
	// ====================================================================
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: ["--start-maximized"],
	});
	const page = await browser.newPage();
	let step = 0;
	const shot = async (name) => {
		step++;
		await waitForImages(page);
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
		// Bước 1: Đăng nhập
		// Hành động: Đăng nhập
		// Dữ liệu: User hợp lệ
		// Kết quả mong muốn: Đăng nhập thành công
		// ====================================================================
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
		console.log('  --- Dữ liệu: User hợp lệ ---');
		await page.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "domcontentloaded" });
		await page.waitForSelector("#loginForm");
		await sleep(1000);
		await page.type("#username", "ngocanh@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);
		console.log("  ✅ Kết quả: Đăng nhập thành công");
		await shot("01-login-success");

		// ====================================================================
		// Bước 2: Đặt tour
		// Hành động: Đặt tour
		// Dữ liệu: Tour hợp lệ
		// Kết quả mong muốn: Booking thành công
		// ====================================================================
		console.log("\n========== BƯỚC 2: ĐẶT TOUR ==========");
		console.log('  --- Dữ liệu: Tour hợp lệ ---');

		await page.goto(`${BASE_URL}/booking-tour?tour_id=3`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await sleep(3000);

		await page.waitForSelector("#booking-form", { timeout: 10000 });
		await page.waitForSelector("#tour-name-display", { timeout: 10000 });
		await sleep(1000);
		console.log("  -> Form đặt tour đã load");

		// Chờ APIs load xong rồi điền form
		await sleep(3000);
		console.log("  -> Điền thông tin form...");
		await page.evaluate(() => {
			document.getElementById("contact_name").value = "Đỗ Thị Ngọc Anh";
			document.getElementById("contact_phone").value = "0967123456";
			document.getElementById("contact_email").value = "ngocanh@gmail.com";
			const dob = document.getElementById("contact_dob");
			if (dob && dob._flatpickr) dob._flatpickr.setDate("1995-08-25");
			document.getElementById("contact_gender").value = "Nữ";
		});
		await sleep(300);

		console.log("  -> Chọn ngày khởi hành...");
		await page.evaluate(() => {
			const sel = document.getElementById("departure_id");
			if (sel) {
				const validOpt = Array.from(sel.options).find((o) => o.value);
				if (validOpt) {
					sel.value = validOpt.value;
					sel.dispatchEvent(new Event("change", { bubbles: true }));
				}
			}
		});
		await sleep(2000);

		const totalAmount = await page.$eval("#total-amount", (el) => el.textContent).catch(() => "N/A");
		console.log(`  -> Tổng tiền: ${totalAmount}`);
		await shot("02-form-filled");

		// Submit booking
		console.log('  -> Gửi đặt tour...');
		await page.evaluate(() => document.getElementById("submitBooking").click());

		// Chờ redirect sang VNPay
		console.log("  -> Đang chờ xử lý...");
		let bookingCreated = false;
		for (let i = 0; i < 30; i++) {
			await sleep(2000);
			const url = page.url();
			if (url.includes("sandbox.vnpayment.vn") || url.includes("vnpay")) {
				console.log(`  -> Đã chuyển trang: ${url.substring(0, 100)}...`);
				bookingCreated = true;
				break;
			}
			if (i % 5 === 0 && i > 0) console.log("  -> (Vẫn đang chờ...)");
		}

		if (bookingCreated) {
			console.log('  ✅ Kết quả: Booking thành công (redirect VNPay)');
		} else {
			console.log('  ⚠️ Kết quả: Booking có thể chưa được tạo');
		}
		await shot("03-booking-created");

		// ====================================================================
		// Bước 3: Chờ thanh toán VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 3: CHỜ THANH TOÁN VNPay ==========");
		console.log("\n══════════════════════════════════════════════");
		console.log("  VUI LÒNG THANH TOÁN TRÊN VNPay (5 PHÚT)");
		console.log("  Thẻ: 9704198526191432198 | OTP: 123456");
		console.log("══════════════════════════════════════════════\n");
		await page.waitForFunction(
			() => window.location.href.includes("payment-result") || window.location.href.includes("vnpay-return"),
			{ timeout: 300000 },
		).catch(() => console.log("  ⚠️ Hết thời gian chờ thanh toán (5 phút)"));
		await sleep(2000);
		console.log(`  => URL sau thanh toán: ${page.url().substring(0, 100)}`);
		await shot("04-payment-result");

		// ====================================================================
		// Bước 4: Mở History
		// ====================================================================
		console.log("\n========== BƯỚC 4: MỞ HISTORY ==========");
		console.log('  --- Dữ liệu: Tài khoản hiện tại ---');

		await page.goto(`${BASE_URL}/pages/user/bookings-history.html`, { waitUntil: "domcontentloaded" });
		await sleep(2000);
		await shot("05-booking-history");

		const bookingItems = await page.$$(".booking-card");
		const count = bookingItems.length;
		console.log(`  => Số booking trong lịch sử: ${count}`);

		if (count > 0) {
			console.log('  ✅ Kết quả: Hiển thị booking vừa tạo trong History');

			// Mở chi tiết booking đầu tiên
			const firstBooking = bookingItems[0];
			const detailLink = await firstBooking.$('a[href*="booking-details"]');
			if (detailLink) {
				const url = await page.evaluate((el) => el.getAttribute("href"), detailLink);
				console.log(`  -> Mở chi tiết: ${url}`);
				await page.goto(url.startsWith("http") ? url : `${BASE_URL}${url}`, { waitUntil: "domcontentloaded" });
				await sleep(2000);
				await shot("06-booking-detail");
				const bookingCode = await page.$eval("#booking-code", (el) => el.textContent).catch(() => "N/A");
				const bookingStatus = await page.$eval("#booking-status", (el) => el.textContent).catch(() => "N/A");
				console.log(`  => Mã đơn: ${bookingCode}`);
				console.log(`  => Trạng thái: ${bookingStatus}`);
			}
		} else {
			console.log('  ⚠️ Kết quả: Không tìm thấy booking trong History');
		}

		// ====================================================================
		// TỔNG KẾT
		// ====================================================================
		console.log("\n============================================");
		console.log(`✅ TC HOÀN TẤT - ${step} ảnh đã lưu`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		console.log("Trình duyệt sẽ đóng sau 10 giây...");
		await sleep(10000);
	} catch (err) {
		console.error(`\n❌ LỖI: ${err.message}`);
		try {
			await page.screenshot({ path: path.join(DIR, "error.png"), fullPage: true });
			console.log("  >> Đã chụp ảnh lỗi");
		} catch (e) {}
	} finally {
		try { await browser.close(); } catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
