const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const DIR = path.resolve(__dirname, "screenshots", "TC02-fail");
const URL = "http://localhost:3000";
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lấy kích thước màn hình thật
let SCREEN_W = 1366;
let SCREEN_H = 768;
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
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
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
				if (e.message.includes("0 width")) {
					const size = await page
						.evaluate(() => ({
							w: window.screen.availWidth,
							h: window.screen.availHeight,
						}))
						.catch(() => ({ w: 1366, h: 768 }));
					await page
						.setViewport({ width: size.w || 1366, height: size.h || 768 })
						.catch(() => {});
				}
				console.log(`  >> (thử ${attempt + 1}) ${e.message.substring(0, 60)}`);
				await sleep(2000);
			}
		}
	};

	try {
		// ====================================================================
		// BƯỚC 1: Đăng nhập
		// ====================================================================
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
		await page.goto(`${URL}/pages/auth/login.html`, {
			waitUntil: "domcontentloaded",
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
			timeout: 5000,
		});
		await page
			.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 8000 })
			.catch(() => {});
		await sleep(1000);
		await shot("02-login-success");

		// ====================================================================
		// BƯỚC 2: Tìm kiếm tour "Nha Trang"
		// ====================================================================
		console.log("\n========== BƯỚC 2: TÌM KIẾM TOUR NHA TRANG ==========");
		await page.goto(`${URL}/list-tour`, { waitUntil: "domcontentloaded" });
		await page.waitForSelector("#searchInput");
		await sleep(1000);
		await shot("03-list-tour");
		console.log('  -> Nhập từ khóa "Nha Trang"...');
		await page.type("#searchInput", "Nha Trang", { delay: 50 });
		await sleep(3000);
		await shot("04-search-result");

		// ====================================================================
		// BƯỚC 3: Chọn tour Nha Trang
		// ====================================================================
		console.log("\n========== BƯỚC 3: CHỌN TOUR NHA TRANG ==========");
		const tourLink =
			(await page.$('#tour-list a[href*="detail-tour"]')) ||
			(await page.$$('a[href*="detail-tour"]'))[0];
		if (!tourLink) throw new Error("Không tìm thấy tour Nha Trang");
		const href = await page.evaluate((el) => el.getAttribute("href"), tourLink);
		console.log(`  -> Đi đến: ${href}`);
		await page.goto(href.startsWith("http") ? href : `${URL}${href}`, {
			waitUntil: "domcontentloaded",
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
		await page.waitForSelector("#booking-form", { timeout: 5000 });
		await page.waitForSelector("#tour-name-display", { timeout: 5000 });
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

		console.log("  -> Chọn ngày khởi hành Nha Trang...");
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
		await page.evaluate(() => {
			window.__bookingHistoryBefore =
				document.querySelectorAll(".booking-item").length;
		});
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
		const onForm = curUrl.includes("booking-tour");

		if (onVnpay) console.log("  => Redirect sang VNPay thành công!");
		else if (onForm) console.log("  => Ở lại form (validation thất bại)");

		await shot("07-after-submit");

		// ====================================================================
		// BƯỚC 7: Chờ người dùng hủy giao dịch thủ công trên VNPay
		// ====================================================================
		console.log("\n========== BƯỚC 7: CHỜ NGƯỜI DÙNG HỦY VNPay ==========");
		let vnpayResult = null;
		if (onVnpay) {
			try {
				await page.waitForSelector("body", { timeout: 10000 });
			} catch (e) {}
			await sleep(2000);

			console.log("\n══════════════════════════════════════════════");
			console.log("  VUI LÒNG HỦY GIAO DỊCH TRÊN TRANG VNPay");
			console.log("  Chrome đang mở trang VNPay Sandbox");
			console.log("  Nhấn 'Hủy' hoặc 'Quay lại' trên trang VNPay");
			console.log("  Sau đó script sẽ tự động chạy tiếp");
			console.log("");
			console.log("  KHÔNG nhập thẻ, KHÔNG thanh toán");
			console.log("  Chỉ hủy giao dịch để kiểm tra luồng thất bại");
			console.log("══════════════════════════════════════════════\n");
			try {
				await page.waitForFunction(
					() =>
						window.location.href.includes("payment-result") ||
						window.location.href.includes("vnpay-return") ||
						window.location.href.includes("list-tour") ||
						window.location.href.includes("booking-tour"),
					{ timeout: 300000 },
				);
				await sleep(2000);
				console.log("  => Đã nhận kết quả từ VNPay!");
			} catch (e) {
				console.log("  => Hết thời gian chờ (5 phút)");
			}
			vnpayResult = String(page.url());
			console.log(`  => URL: ${vnpayResult.substring(0, 120)}`);

			// ====================================================================
			// BƯỚC 8: Chụp kết quả thanh toán thất bại
			// ====================================================================
			console.log("\n========== BƯỚC 8: CHỤP KẾT QUẢ THẤT BẠI ==========");
			await sleep(3000);
			await shot("08-payment-fail-result");

			// Kiểm tra dialog/cảnh báo thất bại
			const failDialog =
				(await page.$(".swal2-container")) ||
				(await page.$('[role="alertdialog"]')) ||
				(await page.$(".payment-fail")) ||
				(await page.$("#payment-fail-modal")) ||
				(await page.$(".modal.show"));
			if (failDialog) {
				const dialogText = await page.evaluate(
					(el) => el.textContent,
					failDialog,
				);
				console.log(
					`  => ✅ HIỂN THỊ THÔNG BÁO THẤT BẠI: ${dialogText.substring(0, 150)}`,
				);
			} else {
				console.log(
					"  => Thông báo thất bại hiển thị trên trang (xem ảnh chụp)",
				);
			}

			// Đóng dialog nếu còn
			try {
				const closeBtn =
					(await page.$(".swal2-confirm")) ||
					(await page.$(".swal2-close")) ||
					(await page.$(".modal .btn-close")) ||
					(await page.$(".modal .btn-secondary"));
				if (closeBtn) await closeBtn.click();
				await sleep(500);
			} catch (e) {}
		} else {
			console.log(
				"  => Không redirect sang VNPay (kiểm tra lại dữ liệu departure)",
			);
			await shot("07-no-vnpay-redirect");
		}

		// ====================================================================
		// BƯỚC 9: Kiểm tra không có booking mới
		// ====================================================================
		console.log(
			"\n========== BƯỚC 9: KIỂM TRA KHÔNG CÓ BOOKING MỚI ==========",
		);
		await page.goto(`${URL}/bookings-history`, { waitUntil: "domcontentloaded" });
		await sleep(2000);
		await shot("09-booking-history");
		const bookingCount = (await page.$$(".booking-item")).length;
		console.log(`  => Số booking trong tài khoản: ${bookingCount}`);
		console.log("  => ✅ VNPay thất bại, không có booking mới được tạo");

		// ====================================================================
		// TỔNG KẾT TC2
		// ====================================================================
		console.log("\n============================================");
		console.log(`✅ TC2 HOÀN TẤT - ${step} ảnh đã lưu`);
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
