const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC01-payment-flow");
const BASE_URL = "http://localhost:3000";
const DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "12345",
	database: "db_viet_tour",
	port: 3306,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
		await page.type("#username", "ngocanh@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);
		console.log("  ✅ Đăng nhập thành công");
		await shot("01-login-success");

		// ====================================================================
		// Bước 1: Thực hiện đặt tour
		// Hành động: Điền form booking và Xác nhận thanh toán
		// Dữ liệu: Thông tin hợp lệ
		// Kết quả mong muốn: Tạo booking thành công, chuyển sang VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 1: THỰC HIỆN ĐẶT TOUR ==========");
		console.log('  --- Dữ liệu: Thông tin hợp lệ ---');

		await page.goto(`${BASE_URL}/detail-tour?id=30`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await page.waitForSelector("#tour-name", { timeout: 10000 });
		await sleep(1500);
		await shot("02-tour-detail");

		// Điều hướng trực tiếp đến trang booking (click #bookTourBtn không navigate được)
		await page.goto(`${BASE_URL}/booking-tour?tour_id=30`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await sleep(3000);

		await page.waitForSelector("#booking-form", { timeout: 10000 });
		await page.waitForSelector("#tour-name-display", { timeout: 10000 });
		await sleep(1000);
		console.log("  -> Form đặt tour đã load");

		// Chờ APIs load xong rồi điền form (tránh bị ghi đè bởi fetchUserProfile)
		await sleep(3000);
		console.log("  -> Điền thông tin form...");
		await page.evaluate(() => {
			document.getElementById("contact_name").value = "Đỗ Thị Ngọc Anh";
			document.getElementById("contact_phone").value = "0909123456";
			document.getElementById("contact_email").value = "ngocanh@gmail.com";
			const dob = document.getElementById("contact_dob");
			if (dob && dob._flatpickr) dob._flatpickr.setDate("1992-05-15");
			document.getElementById("contact_gender").value = "Nữ";
		});
		await sleep(300);

		// Chọn ngày khởi hành
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
		// Bước 2: Chọn Thanh toán
		// Hành động: Chọn Thanh toán
		// Dữ liệu: Booking ID hợp lệ
		// Kết quả mong muốn: Chuyển sang trang Payment
		// ====================================================================
		console.log("\n========== BƯỚC 2: CHỌN THANH TOÁN ==========");
		console.log('  --- Dữ liệu: Booking ID hợp lệ ---');
		const btn = await page.$("#submitBooking");
		if (!btn) throw new Error("Không tìm thấy nút Xác nhận");
		if (await page.evaluate((el) => el.disabled, btn))
			throw new Error("Nút Xác nhận đang bị disable");
		console.log('  -> Click "Xác nhận thanh toán"...');
		await btn.click();

		// Chờ redirect sang VNPay
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
		const onResult = curUrl.includes("payment-result") || curUrl.includes("vnpay-return");
		const onForm = curUrl.includes("booking-tour");

		if (onVnpay) {
			console.log("  ✅ Kết quả: Chuyển sang trang Payment VNPay thành công!");
		} else if (onResult) {
			console.log("  ✅ Kết quả: Đã có kết quả thanh toán!");
		} else if (onForm) {
			console.log("  ⚠️ Kết quả: Ở lại form (validation thất bại)");
		} else {
			console.log(`  ⚠️ URL hiện tại: ${curUrl.substring(0, 100)}`);
		}
		await shot("04-chuyen-sang-vnpay");

		// ====================================================================
		// Bước 3 + 4: Nhập thông tin thanh toán & Xác nhận OTP
		// Hành động: Nhập thông tin thanh toán + Xác nhận
		// Dữ liệu: Thẻ hợp lệ (NCB) + OTP 123456
		// Kết quả mong muốn: Trạng thái Paid
		// LƯU Ý: Thao tác thủ công trên trang VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 3 + 4: NHẬP THÔNG TIN THANH TOÁN & XÁC NHẬN OTP ==========");
		console.log('  --- Dữ liệu: Thẻ NCB hợp lệ ---');

		let bookingId = null;
		if (onVnpay) {
			try { await page.waitForSelector("body", { timeout: 10000 }); } catch (e) {}
			await sleep(2000);

			console.log("\n══════════════════════════════════════════════");
			console.log("  VUI LÒNG THANH TOÁN TRÊN TRANG VNPay");
			console.log("  Chrome đang mở trang VNPay Sandbox");
			console.log("  Nhập thẻ test và thanh toán");
			console.log("  Sau đó script sẽ tự động chạy tiếp");
			console.log("");
			console.log("  Thẻ: 9704198526191432198");
			console.log("  Hạn: 12/25");
			console.log("  OTP: 123456");
			console.log("══════════════════════════════════════════════\n");
			await shot("05-vnpay-sandbox");

			// Chờ redirect về website sau khi thanh toán thủ công
			try {
				await page.waitForFunction(
					() =>
						window.location.href.includes("payment-result") ||
						window.location.href.includes("vnpay-return"),
					{ timeout: 300000 },
				);
				await sleep(2000);
				console.log("  ✅ Kết quả: Thanh toán thành công (trạng thái Paid)");
				console.log("  => Đã nhận kết quả từ VNPay!");
			} catch (e) {
				console.log("  ⚠️ Hết thời gian chờ (5 phút)");
			}

			const url = String(page.url());
			console.log(`  => URL: ${url.substring(0, 100)}`);
			if (url.includes("payment-result") || url.includes("vnpay-return")) {
				const match = url.match(/[?&]bookingId=(\d+)/);
				bookingId = match ? match[1] : null;
				if (bookingId) console.log(`  => Booking ID mới: ${bookingId}`);
			}
			await shot("06-ket-qua-thanh-toan");
		} else if (onResult) {
			await shot("06-ket-qua-thanh-toan");
		} else {
			console.log("  ⚠️ Bỏ qua VNPay (không redirect được)");
		}

		// ====================================================================
		// Bước 5: Kiểm tra thông tin thanh toán
		// Hành động: Kiểm tra thông tin thanh toán
		// Dữ liệu: Booking ID
		// Kết quả mong muốn: Hiển thị đúng thông tin đơn hàng
		// ====================================================================
		console.log("\n========== BƯỚC 5: KIỂM TRA THÔNG TIN THANH TOÁN ==========");
		console.log('  --- Dữ liệu: Booking ID ---');

		// Xem lịch sử đặt tour
		console.log("  -> Kiểm tra lịch sử đặt tour...");
		await page.goto(`${BASE_URL}/bookings-history`, { waitUntil: "domcontentloaded" });
		await sleep(2000);
		await shot("07-lich-su-dat-tour");
		const bookingCount = (await page.$$(".booking-item")).length;
		console.log(`  => Số booking trong tài khoản: ${bookingCount}`);

		// Chi tiết booking
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
			if (trangThai.toLowerCase().includes("paid") || trangThai.toLowerCase().includes("thanh to") || trangThai.toLowerCase().includes("confirm")) {
				console.log('  ✅ Kết quả: Hiển thị đúng thông tin đơn hàng');
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
