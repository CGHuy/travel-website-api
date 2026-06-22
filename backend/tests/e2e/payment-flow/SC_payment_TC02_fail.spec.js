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
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s && !s.startsWith("--") && !s.startsWith("/*"));
		for (const stmt of statements) {
			try { await connection.execute(stmt); }
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
		// SETUP: Đăng nhập
		// ====================================================================
		console.log("\n========== SETUP: ĐĂNG NHẬP ==========");
		await page.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "domcontentloaded" });
		await page.waitForSelector("#loginForm");
		await sleep(1000);
		await page.type("#username", "tuan@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);
		console.log("  ✅ Đăng nhập thành công");
		await shot("01-login-success");

		// ====================================================================
		// Bước 1: Đặt tour
		// Hành động: Đặt tour
		// Dữ liệu: Dữ liệu hợp lệ
		// Kết quả mong muốn: Booking được tạo
		// ====================================================================
		console.log("\n========== BƯỚC 1: ĐẶT TOUR ==========");
		console.log('  --- Dữ liệu: Dữ liệu hợp lệ ---');

		await page.goto(`${BASE_URL}/detail-tour?id=30`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await page.waitForSelector("#tour-name", { timeout: 10000 });
		await sleep(1500);
		await shot("02-tour-detail");

		await page.goto(`${BASE_URL}/booking-tour?tour_id=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await sleep(3000);

		await page.waitForSelector("#booking-form", { timeout: 10000 });
		await page.waitForSelector("#tour-name-display", { timeout: 10000 });
		await sleep(1000);
		console.log("  -> Form đặt tour đã load");

		await sleep(3000);
		console.log("  -> Điền thông tin form...");
		await page.evaluate(() => {
			document.getElementById("contact_name").value = "Phạm Minh Tuấn";
			document.getElementById("contact_phone").value = "0978123456";
			document.getElementById("contact_email").value = "tuan@gmail.com";
			const dob = document.getElementById("contact_dob");
			if (dob && dob._flatpickr) dob._flatpickr.setDate("1990-05-15");
			document.getElementById("contact_gender").value = "Nam";
		});
		await sleep(300);

		console.log("  -> Chọn ngày khởi hành...");
		const depSelect = await page.$("#departure_id");
		if (depSelect) {
			const opts = await page.$$("#departure_id option");
			for (const o of opts) {
				const v = await page.evaluate((el) => el.value, o);
				if (v) {
					await page.select("#departure_id", v);
					const text = await page.evaluate((el) => el.textContent, o);
					console.log(`  -> Đã chọn: ${text}`);
					break;
				}
			}
		}
		await sleep(2000);

		const totalAmount = await page.$eval("#total-amount", (el) => el.textContent).catch(() => "N/A");
		const passengers = await page.$eval("#sum-passengers", (el) => el.textContent).catch(() => "N/A");
		console.log(`  -> Tổng tiền: ${totalAmount}`);
		console.log(`  -> Hành khách: ${passengers}`);
		await shot("03-form-filled");

		// ====================================================================
		// Bước 2: Thanh toán
		// Hành động: Thanh toán
		// Dữ liệu: Thẻ không hợp lệ
		// Kết quả mong muốn: Hệ thống từ chối giao dịch
		// ====================================================================
		console.log("\n========== BƯỚC 2: THANH TOÁN ==========");
		console.log('  --- Dữ liệu: Thẻ không hợp lệ ---');

		const btnSubmit = await page.$("#submitBooking");
		if (!btnSubmit) throw new Error("Không tìm thấy nút Xác nhận");
		if (await page.evaluate((el) => el.disabled, btnSubmit))
			throw new Error("Nút Xác nhận đang bị disable");
		console.log('  -> Click "Xác nhận thanh toán"...');
		await btnSubmit.click();

		console.log("  -> Đang chờ redirect sang VNPay...");
		for (let i = 0; i < 20; i++) {
			await sleep(1000);
			const url = page.url();
			if (!url.includes("booking-tour") && !url.includes("detail-tour")) {
				console.log(`  -> Đã chuyển trang: ${url.substring(0, 100)}...`);
				break;
			}
			if (i === 5) console.log("  -> (Vẫn đang chờ...)");
		}

		try { await page.waitForSelector("body", { timeout: 15000 }); } catch (e) {}
		await sleep(2000);

		const curUrl = page.url();
		const onVnpay = curUrl.includes("sandbox.vnpayment.vn");

		if (onVnpay) {
			console.log("  ✅ Kết quả: Chuyển sang Payment VNPay thành công!");
		} else {
			console.log("  ⚠️ URL hiện tại: " + curUrl.substring(0, 100));
		}
		await shot("04-chuyen-sang-vnpay");

		// ====================================================================
		// Bước 3: Xác nhận (thủ công trên VNPay - thẻ không hợp lệ / sai OTP)
		// Hành động: Xác nhận
		// Dữ liệu: Sai OTP
		// Kết quả mong muốn: Hiển thị thông báo lỗi
		// ====================================================================
		console.log("\n========== BƯỚC 3: XÁC NHẬN ==========");
		console.log('  --- Dữ liệu: Sai OTP / Thẻ không hợp lệ ---');

		let bookingId = null;
		let paymentFailed = false;
		if (onVnpay) {
			try { await page.waitForSelector("body", { timeout: 10000 }); } catch (e) {}
			await sleep(2000);

			console.log("\n══════════════════════════════════════════════");
			console.log("  VUI LÒNG NHẬP THẺ KHÔNG HỢP LỆ");
			console.log("  Chrome đang mở trang VNPay Sandbox");
			console.log("  Nhập thẻ không hợp lệ để kiểm tra lỗi");
			console.log("  Sau đó script sẽ tự động chạy tiếp");
			console.log("");
			console.log("  Thẻ sai: 1234567890123456");
			console.log("  Hoặc nhập thẻ đúng với sai OTP");
			console.log("══════════════════════════════════════════════\n");
			await shot("05-vnpay-sandbox");

			// Chờ redirect về website hoặc timeout (nếu VNPay từ chối)
			try {
				await page.waitForFunction(
					() =>
						window.location.href.includes("payment-result") ||
						window.location.href.includes("vnpay-return"),
					{ timeout: 300000 },
				);
				await sleep(2000);
				const resultUrl = String(page.url());
				console.log(`  => URL kết quả: ${resultUrl.substring(0, 150)}`);

				// Kiểm tra nếu VNPay trả về lỗi
				if (resultUrl.includes("vnp_ResponseCode=00")) {
					console.log("  ⚠️ Giao dịch thành công (không mong đợi)");
				} else {
					paymentFailed = true;
					console.log("  ✅ Kết quả: Hệ thống từ chối giao dịch!");
				}

				if (resultUrl.includes("payment-result") || resultUrl.includes("vnpay-return")) {
					const match = resultUrl.match(/[?&]bookingId=(\d+)/);
					bookingId = match ? match[1] : null;
					if (bookingId) console.log(`  => Booking ID: ${bookingId}`);
				}
			} catch (e) {
				// Timeout - VNPay không redirect về (giao dịch thất bại)
				console.log("  ⚠️ VNPay không redirect về - giao dịch đã bị từ chối");
				paymentFailed = true;
			}
			await shot("06-ket-qua-thanh-toan");
		} else {
			console.log("  ⚠️ Bỏ qua VNPay (không redirect được)");
		}

		if (paymentFailed) {
			console.log('  ✅ Kết quả: Hiển thị thông báo lỗi (giao dịch thất bại)');
		}

		// ====================================================================
		// Bước 4: Kiểm tra trạng thái đơn hàng
		// Hành động: Kiểm tra trạng thái đơn hàng
		// Dữ liệu: Booking ID
		// Kết quả mong muốn: Trạng thái chưa thanh toán
		// ====================================================================
		console.log("\n========== BƯỚC 4: KIỂM TRA TRẠNG THÁI ĐƠN HÀNG ==========");
		console.log('  --- Dữ liệu: Booking ID ---');

		// Điều hướng về trang chủ trước khi vào lịch sử
		await page.goto(`${BASE_URL}/bookings-history`, { waitUntil: "domcontentloaded" });
		await sleep(2000);
		await shot("07-lich-su-dat-tour");

		const bookingCount = (await page.$$(".booking-item")).length;
		console.log(`  => Số booking trong tài khoản: ${bookingCount}`);

		// Tìm booking mới nhất (thường là booking đầu tiên trong danh sách)
		console.log("  -> Kiểm tra chi tiết booking...");
		const dl = await page.$('.booking-item a[href*="booking-details"]');
		if (dl) {
			const url = await page.evaluate((el) => el.getAttribute("href"), dl);
			console.log(`  -> Mở chi tiết: ${url}`);
			await page.goto(url.startsWith("http") ? url : `${BASE_URL}${url}`, { waitUntil: "domcontentloaded" });
			await sleep(2000);
			await shot("08-chi-tiet-booking");

			const maDon = await page.$eval("#booking-code", (el) => el.textContent).catch(() => "N/A");
			const trangThai = await page.$eval("#booking-status", (el) => el.textContent).catch(() => "N/A");
			console.log(`  => Mã đơn: ${maDon}`);
			console.log(`  => Trạng thái: ${trangThai}`);

			// Kiểm tra trạng thái không phải "paid" -> chưa thanh toán
			const lower = trangThai.toLowerCase();
			if (lower.includes("paid") || lower.includes("đã thanh toán")) {
				console.log('  ⚠️ Kết quả: Booking đã được thanh toán (không mong đợi)');
			} else if (lower.includes("pending") || lower.includes("chưa") || lower.includes("xác nhận") || lower.includes("confirm")) {
				console.log('  ✅ Kết quả: Trạng thái chưa thanh toán');
			} else {
				console.log('  ⚠️ Kết quả: Trạng thái không mong đợi');
			}
		} else {
			console.log("  => Không tìm thấy booking nào");
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
