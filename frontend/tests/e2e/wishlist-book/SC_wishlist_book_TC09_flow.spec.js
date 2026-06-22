const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC09-flow");
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
		// BƯỚC 2: TÌM KIẾM TOUR "NHA TRANG"
		// ====================================================================
		console.log("\n========== BƯỚC 2: TÌM KIẾM TOUR ==========");
		await page.goto(`${URL}/list-tour`, { waitUntil: "networkidle0" });
		await page.waitForSelector("#searchInput");
		await sleep(1000);
		await shot("03-list-tour");
		console.log('  -> Nhập từ khóa "Nha Trang"...');
		await page.type("#searchInput", "Nha Trang", { delay: 50 });
		await sleep(3000);
		await shot("04-search-result");

		// ====================================================================
		// BƯỚC 3: CHỌN TOUR NHA TRANG
		// ====================================================================
		console.log("\n========== BƯỚC 3: CHỌN TOUR ==========");
		const tourLink =
			(await page.$('#tour-list a[href*="detail-tour"]')) ||
			(await page.$$('a[href*="detail-tour"]'))[0];
		if (!tourLink) throw new Error("Không tìm thấy tour");
		const href = await page.evaluate((el) => el.getAttribute("href"), tourLink);
		console.log(`  -> Đi đến: ${href}`);
		await page.goto(href.startsWith("http") ? href : `${URL}${href}`, {
			waitUntil: "networkidle0",
		});
		await sleep(1000);
		await shot("05-tour-detail");

		// ====================================================================
		// BƯỚC 4: THÊM VÀO DANH SÁCH YÊU THÍCH
		// ====================================================================
		console.log("\n========== BƯỚC 4: THÊM YÊU THÍCH ==========");
		const heartBtn = await page.$(".btn-action-round.love");
		if (!heartBtn) throw new Error("Không tìm thấy nút yêu thích");
		console.log("  -> Click nút yêu thích...");
		await heartBtn.click();
		await sleep(1500);

		// Kiểm tra icon chuyển từ fa-regular sang fa-solid
		const heartIcon = await heartBtn.$("i");
		const hasSolid = await page.evaluate(
			(el) => el.classList.contains("fa-solid"),
			heartIcon,
		);
		console.log(`  -> Icon heart solid: ${hasSolid}`);

		// Kiểm tra toast xuất hiện
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
		await shot("06-wishlist-added");

		// ====================================================================
		// BƯỚC 5: VÀO TRANG YÊU THÍCH
		// ====================================================================
		console.log("\n========== BƯỚC 5: TRANG YÊU THÍCH ==========");
		await page.goto(`${URL}/favorite`, { waitUntil: "networkidle0" });
		await sleep(2000);
		await shot("07-favorite-page");

		const favCards = await page.$$(".favorite-card");
		console.log(`  -> Số tour yêu thích: ${favCards.length}`);
		if (favCards.length === 0) {
			console.log("  -> Không có tour yêu thích, kiểm tra no-favorites...");
			const noFav = await page.$("#no-favorites:not(.d-none)");
			if (noFav) {
				throw new Error("Tour không được thêm vào wishlist");
			}
		}

		// ====================================================================
		// BƯỚC 6: XEM CHI TIẾT TỪ WISHLIST
		// ====================================================================
		console.log("\n========== BƯỚC 6: XEM CHI TIẾT TỪ WISHLIST ==========");
		const viewDetail = await page.$(".btn-view-detail");
		if (!viewDetail) throw new Error("Không tìm thấy nút Xem chi tiết");
		const detailHref = await page.evaluate(
			(el) => el.getAttribute("href"),
			viewDetail,
		);
		console.log(`  -> Đi đến: ${detailHref}`);
		await page.goto(
			detailHref.startsWith("http") ? detailHref : `${URL}${detailHref}`,
			{ waitUntil: "networkidle0" },
		);
		await sleep(1500);
		await shot("08-detail-from-wishlist");

		// Kiểm tra heart vẫn đang fill
		const heartAgain = await page.$(".btn-action-round.love i");
		if (heartAgain) {
			const isFilled = await page.evaluate(
				(el) => el.classList.contains("fa-solid"),
				heartAgain,
			);
			console.log(`  -> Heart vẫn fill: ${isFilled}`);
		}

		// ====================================================================
		// BƯỚC 7: ĐẶT TOUR NGAY
		// ====================================================================
		console.log("\n========== BƯỚC 7: ĐẶT TOUR ==========");
		const bookBtn = await page.$("#bookTourBtn");
		if (!bookBtn) throw new Error("Không tìm thấy nút Đặt tour");
		console.log('  -> Click "Đặt Tour ngay"...');
		await bookBtn.click();
		await page.waitForSelector("#booking-form", { timeout: 10000 });
		await page.waitForSelector("#tour-name-display", { timeout: 10000 });
		await sleep(2500);
		console.log("  -> Form đặt tour đã load");

		// ====================================================================
		// BƯỚC 8: NHẬP THÔNG TIN FORM
		// ====================================================================
		console.log("\n========== BƯỚC 8: NHẬP THÔNG TIN ==========");
		// Form tự động điền từ profile
		console.log("  -> Kiểm tra thông tin liên hệ...");
		const contactName = await page
			.$eval("#contact_name", (el) => el.value)
			.catch(() => "");
		console.log(`  -> Họ tên: ${contactName || "(trống)"}`);

		// Ngày sinh (nếu chưa có)
		const dobVal = await page
			.$eval("#contact_dob", (el) => el.value)
			.catch(() => "");
		if (!dobVal) {
			console.log("  -> Điền ngày sinh: 01/01/1990");
			await page.evaluate(() => {
				const p = document.getElementById("contact_dob")._flatpickr;
				if (p) p.setDate("1990-01-01");
			});
			await sleep(500);
		} else {
			console.log(`  -> Ngày sinh (đã có): ${dobVal}`);
		}

		// Giới tính (nếu chưa có)
		const genderVal = await page
			.$eval("#contact_gender", (el) => el.value)
			.catch(() => "");
		if (!genderVal) {
			console.log("  -> Chọn giới tính: Nam");
			await page.select("#contact_gender", "Nam");
			await sleep(300);
		} else {
			console.log(`  -> Giới tính (đã có): ${genderVal}`);
		}

		// Chọn ngày khởi hành
		console.log("  -> Chọn ngày khởi hành...");
		const depSelect = await page.$("#departure_id");
		if (depSelect) {
			const opts = await page.$$("#departure_id option");
			let found = false;
			for (const o of opts) {
				const v = await page.evaluate((el) => el.value, o);
				if (v) {
					await page.select("#departure_id", v);
					const text = await page.evaluate((el) => el.textContent, o);
					console.log(`  -> Đã chọn: ${text}`);
					found = true;
					break;
				}
			}
			if (!found) console.log("  -> Không có lịch khởi hành khả dụng");
		}
		await sleep(2000);

		const totalAmount = await page
			.$eval("#total-amount", (el) => el.textContent)
			.catch(() => "N/A");
		const passengers = await page
			.$eval("#sum-passengers", (el) => el.textContent)
			.catch(() => "N/A");
		console.log(`  -> Tổng tiền: ${totalAmount}`);
		console.log(`  -> Hành khách: ${passengers}`);
		await sleep(1000);
		await shot("09-form-filled");

		// ====================================================================
		// BƯỚC 9: XÁC NHẬN ĐẶT TOUR
		// ====================================================================
		console.log("\n========== BƯỚC 9: XÁC NHẬN ĐẶT TOUR ==========");
		const submitBtn = await page.$("#submitBooking");
		if (!submitBtn) throw new Error("Không tìm thấy nút Xác nhận");
		if (await page.evaluate((el) => el.disabled, submitBtn))
			throw new Error("Nút Xác nhận đang bị disable (có thể user không phải customer)");
		// Đóng flatpickr popup nếu còn mở (che submit button)
		await page.evaluate(() => {
			const fp = document.getElementById("contact_dob")._flatpickr;
			if (fp && fp.isOpen) fp.close();
		});
		await sleep(500);
		console.log('  -> Click "Xác nhận thanh toán"...');
		await page.evaluate((el) => el.click(), submitBtn);
		console.log("  -> Đang chờ redirect sang VNPay...");
		for (let i = 0; i < 20; i++) {
			await sleep(1000);
			const url = page.url();
			if (!url.includes("booking-tour")) {
				console.log(`  -> Đã chuyển trang: ${url.substring(0, 80)}...`);
				break;
			}
			if (i === 5) console.log("  -> (Vẫn đang chờ...)");
			if (i === 10) console.log("  -> (Có thể form validation thất bại)");
		}

		try {
			await page.waitForSelector("body", { timeout: 15000 });
		} catch (e) {}
		await sleep(2000);

		const curUrl = page.url();
		const onVnpay = curUrl.includes("sandbox.vnpayment.vn");
		const onResult =
			curUrl.includes("payment-result") || curUrl.includes("vnpay-return");
		const onForm = curUrl.includes("booking-tour");

		if (onVnpay) console.log("  => Redirect sang VNPay thành công!");
		else if (onResult) console.log("  => Đã có kết quả thanh toán!");
		else if (onForm) console.log("  => Ở lại form (validation thất bại)");
		await shot("10-after-submit");

		// ====================================================================
		// BƯỚC 10: THANH TOÁN THỦ CÔNG TRÊN VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 10: THANH TOÁN VNPay ==========");
		let bookingId = null;
		if (onVnpay) {
			try {
				await page.waitForSelector("body", { timeout: 10000 });
			} catch (e) {}
			await sleep(2000);

			console.log("\n══════════════════════════════════════════════");
			console.log("  VUI LÒNG THANH TOÁN TRÊN TRANG VNPay");
			console.log("  Chrome đang mở trang VNPay Sandbox");
			console.log("");
			console.log("  Sau khi thanh toán xong, script sẽ tự chạy tiếp");
			console.log("══════════════════════════════════════════════\n");

			try {
				await page.waitForFunction(
					() =>
						window.location.href.includes("payment-result") ||
						window.location.href.includes("vnpay-return"),
					{ timeout: 300000 },
				);
				await sleep(2000);
				console.log("  => Đã nhận kết quả từ VNPay!");
			} catch (e) {
				console.log("  => Hết thời gian chờ (5 phút)");
			}
			const url = String(page.url());
			console.log(`  => URL: ${url.substring(0, 100)}`);
			if (url.includes("payment-result") || url.includes("vnpay-return")) {
				const match = url.match(/[?&]bookingId=(\d+)/);
				bookingId = match ? match[1] : null;
				if (bookingId) console.log(`  => Booking ID mới: ${bookingId}`);
			}
			await shot("11-payment-result");
		} else if (onResult) {
			const url = String(page.url());
			const match = url.match(/[?&]bookingId=(\d+)/);
			bookingId = match ? match[1] : null;
			if (bookingId) console.log(`  => Booking ID mới: ${bookingId}`);
			await shot("11-payment-result");
		} else {
			console.log("  => Bỏ qua VNPay (không redirect được)");
		}

		// ====================================================================
		// BƯỚC 11: LỊCH SỬ ĐẶT TOUR
		// ====================================================================
		console.log("\n========== BƯỚC 11: LỊCH SỬ ĐẶT TOUR ==========");
		await page.goto(`${URL}/bookings-history`, { waitUntil: "networkidle0" });
		await sleep(2000);
		await shot("12-booking-history");
		const bookingCount = (await page.$$(".booking-item")).length;
		console.log(`  => Số booking trong tài khoản: ${bookingCount}`);

		// ====================================================================
		// BƯỚC 12: CHI TIẾT BOOKING (NẾU CÓ)
		// ====================================================================
		console.log("\n========== BƯỚC 12: CHI TIẾT BOOKING ==========");
		const dl = await page.$('.booking-item a[href*="booking-details"]');
		if (dl) {
			const detailUrl = await page.evaluate(
				(el) => el.getAttribute("href"),
				dl,
			);
			console.log(`  -> Mở chi tiết: ${detailUrl}`);
			await page.goto(
				detailUrl.startsWith("http") ? detailUrl : `${URL}${detailUrl}`,
				{ waitUntil: "networkidle0" },
			);
			await sleep(2000);
			await shot("13-booking-detail");
			console.log(
				`  Mã: ${await page
					.$eval("#booking-code", (el) => el.textContent)
					.catch(() => "N/A")}`,
			);
			console.log(
				`  Trạng thái: ${await page
					.$eval("#booking-status", (el) => el.textContent)
					.catch(() => "N/A")}`,
			);
		} else {
			console.log("  => Không tìm thấy booking nào");
		}

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
