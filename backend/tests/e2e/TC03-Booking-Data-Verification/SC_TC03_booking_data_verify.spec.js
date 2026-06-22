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
		// Lưu dữ liệu gốc để so sánh
		// ====================================================================
		const expectedData = {};

		// ====================================================================
		// BƯỚC 1: ĐĂNG NHẬP
		// ====================================================================
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
		console.log("  --- Dữ liệu: User hợp lệ ---");
		await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await page.waitForSelector("#loginForm", { timeout: 10000 });
		await page.evaluate(() => {
			document.querySelector("#username").value = "ngocanh@gmail.com";
			document.querySelector("#password").value = "123456";
		});
		await sleep(500);
		await page.evaluate(() => {
			document.querySelector("#loginForm button[type='submit']").click();
		});
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await shot("01-login-success");
		console.log("  ✅ Kết quả: Đăng nhập thành công");

		// ====================================================================
		// BƯỚC 2: ĐẶT TOUR - LƯU DỮ LIỆU GỐC
		// ====================================================================
		console.log("\n========== BƯỚC 2: ĐẶT TOUR ==========");
		console.log("  --- Dữ liệu: Tour Đà Lạt (id=1) ---");
		await page.goto(`${BASE_URL}/booking-tour?tour_id=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await sleep(3000);
		await page.waitForSelector("#booking-form", { timeout: 10000 });
		await page.waitForSelector("#tour-name-display", { timeout: 10000 });
		await sleep(1000);

		// Đọc thông tin tour từ trang
		expectedData.tourName = await page.evaluate(
			() => document.querySelector("#tour-name-display")?.textContent?.trim() || ""
		);
		expectedData.tourDuration = await page.evaluate(
			() => document.querySelector("#tour-duration")?.textContent?.trim() || ""
		);
		console.log(`  -> Tour: ${expectedData.tourName}`);
		console.log(`  -> Thời gian: ${expectedData.tourDuration}`);

		await sleep(3000);
		console.log("  -> Điền thông tin form...");
		await page.evaluate(() => {
			document.getElementById("contact_name").value = "Đỗ Thị Ngọc Anh";
			document.getElementById("contact_phone").value = "0987654321";
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

		// Lưu departure text + location
		expectedData.departureText = await page.evaluate(() => {
			const sel = document.getElementById("departure_id");
			if (sel && sel.options[sel.selectedIndex]) {
				return sel.options[sel.selectedIndex].textContent.trim();
			}
			return "";
		});
		expectedData.departureLocation = await page.evaluate(() => {
			const sel = document.getElementById("departure_id");
			if (sel && sel.options[sel.selectedIndex]) {
				const txt = sel.options[sel.selectedIndex].textContent.trim();
				const parts = txt.split(" - ");
				return parts.length >= 2 ? parts[1].replace("Khởi hành từ ", "").trim() : "";
			}
			return "";
		});
		expectedData.departureDate = await page.evaluate(() => {
			const sel = document.getElementById("departure_id");
			if (sel && sel.options[sel.selectedIndex]) {
				return sel.options[sel.selectedIndex].textContent.trim().split(" - ")[0].trim();
			}
			return "";
		});
		console.log(`  -> Đã chọn: ${expectedData.departureText}`);
		console.log(`  -> Điểm khởi hành: ${expectedData.departureLocation}`);
		console.log(`  -> Ngày khởi hành: ${expectedData.departureDate}`);

		// Lưu tổng tiền
		expectedData.totalAmount = await page.$eval("#total-amount", (el) => el.textContent.trim()).catch(() => "N/A");
		console.log(`  -> Tổng tiền: ${expectedData.totalAmount}`);

		await shot("02-form-filled");

		console.log("\n  📋 DỮ LIỆU GỐC CẦN KIỂM TRA:");
		console.log(`     - Tên tour: "${expectedData.tourName}"`);
		console.log(`     - Ngày khởi hành: "${expectedData.departureDate}"`);
		console.log(`     - Nơi khởi hành: "${expectedData.departureLocation}"`);
		console.log(`     - Tổng tiền: "${expectedData.totalAmount}"`);

		// ====================================================================
		// BƯỚC 3: GỬI ĐẶT TOUR
		// ====================================================================
		console.log("\n========== BƯỚC 3: GỬI ĐẶT TOUR ==========");
		console.log("  -> Gửi đặt tour...");
		await page.evaluate(() => document.getElementById("submitBooking").click());
		await sleep(3000);
		let redirected = false;
		for (let i = 0; i < 30; i++) {
			const url = page.url();
			if (url.includes("sandbox.vnpayment.vn") || url.includes("vnpay")) {
				redirected = true;
				console.log(`  -> Đã chuyển trang: ${url.substring(0, 80)}...`);
				break;
			}
			await sleep(2000);
			console.log("  -> (Vẫn đang chờ...)");
		}
		if (redirected) {
			console.log("  ✅ Kết quả: Booking thành công (redirect VNPay)");
		} else {
			console.log("  ⚠️ Kết quả: Booking có thể chưa được tạo");
		}
		await shot("03-booking-vnpay");

		// Chờ thanh toán (hoặc timeout)
		console.log("\n  VUI LÒNG THANH TOÁN TRÊN VNPay (5 phút)");
		console.log("  Thẻ: 9704198526191432198 | OTP: 123456");
		await page.waitForFunction(
			() => window.location.href.includes("payment-result") || window.location.href.includes("vnpay-return"),
			{ timeout: 300000 },
		).catch(() => console.log("  ⚠️ Hết thời gian chờ thanh toán"));
		await sleep(2000);
		await shot("04-payment-result");

		// ====================================================================
		// BƯỚC 4: MỞ LỊCH SỬ ĐẶT TOUR
		// ====================================================================
		console.log("\n========== BƯỚC 4: MỞ LỊCH SỬ ĐẶT TOUR ==========");
		console.log("  --- Dữ liệu: User hiện tại ---");
		await page.goto(`${BASE_URL}/pages/user/bookings-history.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
		await sleep(3000);
		await shot("05-booking-history");

		// ====================================================================
		// BƯỚC 5: KIỂM TRA DỮ LIỆU TRONG HISTORY
		// ====================================================================
		console.log("\n========== BƯỚC 5: KIỂM TRA DỮ LIỆU HISTORY ==========");
		console.log("  --- Mong đợi tìm booking với tour Đà Lạt ---");

		// Đọc dữ liệu từ booking card đầu tiên
		const historyData = await page.evaluate(() => {
			const cards = document.querySelectorAll(".booking-card");
			if (!cards || cards.length === 0) return null;
			const firstCard = cards[0];
			const tourName = firstCard.querySelector("h4")?.textContent?.trim() || "";
			const infoRows = Array.from(firstCard.querySelectorAll(".info-row")).map(r => r.textContent.trim().replace(/\s+/g, " "));
			return { tourName, infoRows, count: cards.length };
		});
		if (historyData) {
			console.log(`  => Card đầu: Tour="${historyData.tourName}", #cards=${historyData.count}`);
			console.log(`  => Info: ${historyData.infoRows.join(" | ")}`);
		} else {
			console.log("  ⚠️ Không tìm thấy booking card nào trong history");
		}

		// Kiểm tra tên tour
		const foundTourName = historyData?.tourName?.includes(expectedData.tourName);
		if (foundTourName) {
			console.log("  ✅ Kết quả: Tên tour trong history khớp với dữ liệu đặt");
		} else {
			console.log(`  ⚠️ Kết quả: Tên tour "${expectedData.tourName}" không tìm thấy trong history`);
			console.log(`     Card tour: "${historyData?.tourName}"`);
		}

		// Kiểm tra departure location từ info-row "Nơi khởi hành"
		const depRow = historyData?.infoRows?.find(r => r.includes("Nơi khởi hành"));
		const foundLocation = depRow?.includes(expectedData.departureLocation);
		if (foundLocation) {
			console.log("  ✅ Kết quả: Điểm khởi hành trong history khớp");
		} else {
			console.log(`  ⚠️ Kết quả: Điểm khởi hành "${expectedData.departureLocation}" không tìm thấy trong history`);
			console.log(`     Dep row: "${depRow}"`);
		}

		// Kiểm tra departure date từ info-row "Ngày khởi hành"
		const dateRow = historyData?.infoRows?.find(r => r.includes("Ngày khởi hành"));
		const foundDate = dateRow?.includes(expectedData.departureDate);
		if (foundDate) {
			console.log("  ✅ Kết quả: Ngày khởi hành trong history khớp");
		} else {
			console.log(`  ⚠️ Kết quả: Ngày khởi hành "${expectedData.departureDate}" không tìm thấy trong history`);
			console.log(`     Date row: "${dateRow}"`);
		}

		// Lưu booking code để mở chi tiết
		const bokRow = historyData?.infoRows?.find(r => r.includes("Mã booking"));
		const bookingCode = bokRow?.replace("Mã booking:", "").trim();

		// ====================================================================
		// BƯỚC 6: KIỂM TRA CHI TIẾT BOOKING
		// ====================================================================
		console.log("\n========== BƯỚC 6: KIỂM TRA CHI TIẾT BOOKING ==========");
		// Mở chi tiết booking đầu tiên
		const detailLink = await page.evaluate(() => {
			const links = document.querySelectorAll('a[href*="booking-details"]');
			if (links.length > 0) return links[0].getAttribute("href");
			return null;
		});

		if (detailLink) {
			console.log(`  -> Mở chi tiết: ${detailLink}`);
			await page.goto(detailLink.startsWith("http") ? detailLink : `${BASE_URL}${detailLink}`, {
				waitUntil: "domcontentloaded", timeout: 30000,
			});
			await sleep(2000);
			await shot("06-booking-detail");

			// Đọc dữ liệu chi tiết từ các element cụ thể
			const detailData = await page.evaluate(() => {
				return {
					tourName: document.querySelector("#tour-name")?.textContent?.trim() || "",
					totalPrice: document.querySelector("#total-price")?.textContent?.trim() || "",
					bookingStatus: document.querySelector("#booking-status")?.textContent?.trim() || "",
					paymentStatus: document.querySelector("#payment-status")?.textContent?.trim() || "",
					bodyText: document.body.innerText,
				};
			});

			console.log(`  => Chi tiết tour: "${detailData.tourName}"`);
			console.log(`  => Giá hiển thị: "${detailData.totalPrice}"`);
			console.log(`  => Trạng thái: "${detailData.bookingStatus}" / "${detailData.paymentStatus}"`);

			// Kiểm tra tên tour
			if (detailData.tourName === expectedData.tourName) {
				console.log("  ✅ Kết quả: Chi tiết booking hiển thị đúng tên tour");
			} else {
				console.log(`  ⚠️ Kết quả: Tên tour không khớp (expected="${expectedData.tourName}", actual="${detailData.tourName}")`);
			}

			// Kiểm tra giá tour cơ bản (xuất hiện trong chi tiết)
			const basePriceNum = expectedData.totalAmount.replace(/[^\d]/g, "");
			const foundBasePrice = detailData.bodyText.includes(basePriceNum);
			if (basePriceNum && foundBasePrice) {
				console.log("  ✅ Kết quả: Giá tour cơ bản trong chi tiết khớp");
			} else {
				console.log(`  ⚠️ Kết quả: Giá "${expectedData.totalAmount}" không tìm thấy trong chi tiết`);
			}

			// Kiểm tra tổng tiền (tổng = giá tour + di chuyển)
			const totalNum = detailData.totalPrice.replace(/[^\d]/g, "");
			if (totalNum && parseInt(totalNum) > parseInt(basePriceNum || "0")) {
				console.log(`  ✅ Kết quả: Tổng tiền ${detailData.totalPrice} hợp lệ (bao gồm phí di chuyển)`);
			} else {
				console.log(`  ⚠️ Kết quả: Tổng tiền ${detailData.totalPrice} không hợp lệ`);
			}

			// Kiểm tra trạng thái
			if (detailData.bookingStatus?.toLowerCase().includes("xác nhận") || detailData.bookingStatus?.toLowerCase().includes("confirmed")) {
				console.log("  ✅ Kết quả: Trạng thái booking hiển thị đúng");
			} else {
				console.log("  ⚠️ Kết quả: Trạng thái booking có thể chưa cập nhật");
			}
		} else {
			console.log("  ⚠️ Kết quả: Không tìm thấy link chi tiết booking");
		}

		// ====================================================================
		// TỔNG KẾT
		// ====================================================================
		console.log("\n========== TỔNG KẾT KIỂM TRA ==========");
		console.log("  📋 Dữ liệu gốc khi đặt tour:");
		console.log(`     - Tour: ${expectedData.tourName}`);
		console.log(`     - Ngày khởi hành: ${expectedData.departureDate}`);
		console.log(`     - Nơi khởi hành: ${expectedData.departureLocation}`);
		console.log(`     - Tổng tiền: ${expectedData.totalAmount}`);
		console.log("");
		console.log("  ✅ Kiểm tra tính chính xác dữ liệu trong History hoàn tất");

		await shot("07-summary");

		console.log("\n============================================");
		console.log("✅ TC HOÀN TẤT - 7 ảnh đã lưu");
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================");

	} catch (err) {
		console.error(`\n  ❌ Lỗi: ${err.message}`);
		console.error(err.stack);
	}

	console.log("\nTrình duyệt sẽ đóng sau 10 giây...");
	await sleep(10000);
	await browser.close();
	console.log("Đã đóng trình duyệt");
})();
