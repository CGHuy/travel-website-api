const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "TC01-success");
const URL = "http://localhost:3000";
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ trước khi chạy
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
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
			console.log(`  >> Chờ rồi chụp lại: ${name}.png`);
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
		// BƯỚC 1: Đăng nhập
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
		// BƯỚC 2: Tìm kiếm tour "Ninh Bình"
		// ====================================================================
		console.log("\n========== BƯỚC 2: TÌM KIẾM TOUR ==========");
		await page.goto(`${URL}/list-tour`, { waitUntil: "networkidle0" });
		await page.waitForSelector("#searchInput");
		await sleep(1000);
		await shot("03-list-tour");
		console.log('  -> Nhập từ khóa "Ninh Bình"...');
		await page.type("#searchInput", "Ninh Bình", { delay: 50 });
		await sleep(3000);
		await shot("04-search-result");

		// ====================================================================
		// BƯỚC 3: Chọn tour Ninh Bình
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
		// BƯỚC 4: Nhấn "Đặt Tour ngay"
		// ====================================================================
		console.log("\n========== BƯỚC 4: ĐẶT TOUR ==========");
		const bookBtn = await page.$("#bookTourBtn");
		if (!bookBtn) throw new Error("Không tìm thấy nút Đặt tour");
		console.log('  -> Click "Đặt Tour ngay"...');
		await bookBtn.click();
		await page.waitForSelector("#booking-form", { timeout: 10000 });
		await page.waitForSelector("#tour-name-display", { timeout: 10000 });
		await sleep(2500);
		console.log("  -> Form đặt tour đã load");

		// ====================================================================
		// BƯỚC 5: Nhập thông tin form
		// ====================================================================
		console.log("\n========== BƯỚC 5: NHẬP THÔNG TIN FORM ==========");
		console.log("  -> Điền họ tên: Võ Hoàng Nam");
		await page.$eval("#contact_name", (el) => (el.value = ""));
		await page.type("#contact_name", "Võ Hoàng Nam", { delay: 20 });
		await sleep(500);

		console.log("  -> Điền SĐT: 0945123789");
		await page.$eval("#contact_phone", (el) => (el.value = ""));
		await page.type("#contact_phone", "0945123789", { delay: 20 });
		await sleep(500);

		console.log("  -> Điền ngày sinh: 01/01/1990");
		await page.evaluate(() => {
			const p = document.getElementById("contact_dob")._flatpickr;
			if (p) p.setDate("1990-01-01");
		});
		await sleep(500);

		console.log("  -> Chọn giới tính: Nam");
		await page.select("#contact_gender", "Nam");
		await sleep(300);

		console.log("  -> Điền email: nam@gmail.com");
		await page.$eval("#contact_email", (el) => (el.value = ""));
		await page.type("#contact_email", "nam@gmail.com", { delay: 20 });
		await sleep(500);

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

		const totalAmount = await page
			.$eval("#total-amount", (el) => el.textContent)
			.catch(() => "N/A");
		const passengers = await page
			.$eval("#sum-passengers", (el) => el.textContent)
			.catch(() => "N/A");
		console.log(`  -> Tổng tiền: ${totalAmount}`);
		console.log(`  -> Hành khách: ${passengers}`);
		await sleep(1000);
		await shot("06-form-filled");

		// ====================================================================
		// BƯỚC 6: Xác nhận đặt tour → redirect VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 6: XÁC NHẬN ĐẶT TOUR ==========");
		const btn = await page.$("#submitBooking");
		if (!btn) throw new Error("Không tìm thấy nút Xác nhận");
		if (await page.evaluate((el) => el.disabled, btn))
			throw new Error("Nút Xác nhận đang bị disable");
		console.log('  -> Click "Xác nhận thanh toán"...');
		await btn.click();
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
		await shot("07-after-submit");

		// ====================================================================
		// BƯỚC 7: Chờ người dùng thanh toán thủ công trên VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 7: THANH TOÁN VNPay ==========");
		let bookingId = null;
		if (onVnpay) {
			try {
				await page.waitForSelector("body", { timeout: 10000 });
			} catch (e) {}
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
			await shot("08-payment-result");
		} else if (onResult) {
			await shot("08-payment-result");
		} else {
			console.log("  => Bỏ qua VNPay (không redirect được)");
		}

		// ====================================================================
		// BƯỚC 8: Lịch sử đặt tour
		// ====================================================================
		console.log("\n========== BƯỚC 8: LỊCH SỬ ĐẶT TOUR ==========");
		await page.goto(`${URL}/bookings-history`, { waitUntil: "networkidle0" });
		await sleep(2000);
		await shot("09-booking-history");
		const bookingCount = (await page.$$(".booking-item")).length;
		console.log(`  => Số booking trong tài khoản: ${bookingCount}`);

		// ====================================================================
		// BƯỚC 9: Chi tiết booking
		// ====================================================================
		console.log("\n========== BƯỚC 9: CHI TIẾT BOOKING ==========");
		const dl = await page.$('.booking-item a[href*="booking-details"]');
		if (dl) {
			const url = await page.evaluate((el) => el.getAttribute("href"), dl);
			console.log(`  -> Mở chi tiết: ${url}`);
			await page.goto(url.startsWith("http") ? url : `${URL}${url}`, {
				waitUntil: "networkidle0",
			});
			await sleep(2000);
			await shot("10-booking-detail");
			console.log(
				`  Mã: ${await page.$eval("#booking-code", (el) => el.textContent).catch(() => "N/A")}`,
			);
			console.log(
				`  Trạng thái: ${await page.$eval("#booking-status", (el) => el.textContent).catch(() => "N/A")}`,
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
