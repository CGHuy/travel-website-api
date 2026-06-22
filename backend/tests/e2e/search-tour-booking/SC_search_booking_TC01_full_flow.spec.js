const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC01-search-booking-flow");
const BASE_URL = "http://localhost:3000";
const DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "12345",
	database: "db_viet_tour",
	port: 3306,
};
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ trước khi chạy
if (fs.existsSync(DIR)) {
	fs.rmSync(DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	// ====================================================================
	// RESET DB: chạy seed.sql trước khi test
	// ====================================================================
	console.log("\n========== RESET DATABASE ==========");
	let connection;
	try {
		connection = await mysql.createConnection(DB_CONFIG);
		const seedSql = fs.readFileSync(
			path.join(__dirname, "seed.sql"),
			"utf-8",
		);
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
	let step = 0;
	const shot = async (page, name) => {
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

	const gotoOpts = (wait) => ({
		waitUntil: wait || "domcontentloaded",
		timeout: 30000,
	});

	const login = async (page, email, password) => {
		console.log(`\n  --- Đăng nhập ---`);
		await page.goto(`${BASE_URL}/pages/auth/login.html`, gotoOpts());
		await page.waitForSelector("#loginForm");
		await sleep(500);
		await page.type("#username", email, { delay: 30 });
		await page.type("#password", password, { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, {
			timeout: 8000,
		});
		await page
			.waitForNavigation(gotoOpts())
			.catch(() => {});
		await sleep(1000);
	};

	let userContext, userPage;

	try {
		// ====================================================================
		// Bước 1: Truy cập trang chủ VietTravel
		// Hành động: Truy cập URL Website
		// Kết quả mong muốn: Hiển thị trang chủ
		// ====================================================================
		console.log("\n========== BƯỚC 1: TRUY CẬP TRANG CHỦ VIETTRAVEL ==========");
		userContext = await browser.createBrowserContext();
		userPage = await userContext.newPage();

		await userPage.goto(`${BASE_URL}/pages/index.html`, gotoOpts());
		await sleep(1500);
		await shot(userPage, "01-trang-chu");

		const pageTitle = await userPage.title();
		if (pageTitle.includes("VietTravel")) {
			console.log("  ✅ Kết quả: Trang chủ hiển thị thành công (title: " + pageTitle + ")");
		} else {
			console.log(`  ⚠️ Kết quả: Title không đúng - ${pageTitle}`);
		}

		// ====================================================================
		// Bước 2: Nhập từ khóa tìm kiếm "Đà Nẵng"
		// Hành động: Nhập từ khóa tìm kiếm
		// Dữ liệu: Đà Nẵng
		// Kết quả mong muốn: Danh sách tour Đà Nẵng hiển thị
		// ====================================================================
		console.log("\n========== BƯỚC 2: NHẬP TỪ KHÓA TÌM KIẾM ==========");
		console.log('  --- Dữ liệu: "Đà Nẵng" ---');

		await userPage.goto(`${BASE_URL}/pages/user/list-tour.html`, gotoOpts());
		await sleep(1500);

		// Chờ ô tìm kiếm xuất hiện
		try {
			await userPage.waitForSelector("#searchInput", { timeout: 8000 });
		} catch (e) {
			console.log("  ⚠️ Không tìm thấy #searchInput, chờ thêm 3s...");
			await sleep(3000);
		}
		await shot(userPage, "02-list-tour");

		// Nhập từ khóa tìm kiếm
		await userPage.click("#searchInput");
		await sleep(300);
		await userPage.type("#searchInput", "Đà Nẵng", { delay: 50 });

		// Chờ API tìm kiếm trả về
		try {
			await userPage.waitForResponse(
				(response) =>
					response.url().includes("/api/list-tours") &&
					response.request().method() === "GET",
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  ⚠️ API search timeout, chờ thêm DOM...");
		}
		await sleep(2000);

		// Chờ kết quả tour hiển thị
		try {
			await userPage.waitForFunction(
				() => {
					const el = document.querySelector("#tour-list");
					return el && el.innerText.includes("Đà Nẵng");
				},
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  ⚠️ Không thấy tour Đà Nẵng trong danh sách");
		}
		await shot(userPage, "03-ket-qua-tim-kiem");

		if (await userPage.evaluate(() => {
			const el = document.querySelector("#tour-list");
			return el && el.innerText.includes("Đà Nẵng");
		})) {
			console.log('  ✅ Kết quả: Danh sách tour Đà Nẵng hiển thị');
		} else {
			console.log('  ⚠️ Kết quả: Không thấy tour Đà Nẵng');
		}

		// ====================================================================
		// Bước 3: Chọn tour "Tour Đà Nẵng 3N2Đ"
		// Hành động: Chọn một tour
		// Dữ liệu: Tour Đà Nẵng 3N2Đ
		// Kết quả mong muốn: Hiển thị chi tiết tour
		// ====================================================================
		console.log("\n========== BƯỚC 3: CHỌN TOUR ==========");
		console.log('  --- Dữ liệu: "Tour Đà Nẵng 3N2Đ" ---');

		let tourUrl = null;
		let tourId = null;
		try {
			// Tour cards dùng onclick="/detail-tour?id=X", link "Xem chi tiết" là <a>
			const tourInfo = await userPage.evaluate(() => {
				const cards = document.querySelectorAll("#tour-list .tour-horizontal-card");
				for (const card of cards) {
					if (card.innerText.includes("Đà Nẵng 3N2Đ") || card.innerText.includes("Tour Đà Nẵng")) {
						// Lấy id từ onclick="window.location.href='/detail-tour?id=X'"
						const onclick = card.getAttribute("onclick") || "";
						const match = onclick.match(/id=(\d+)/);
						if (match) {
							return { id: match[1] };
						}
						// Fallback: tìm link "Xem chi tiết" trong card
						const detailLink = card.querySelector('a[href*="/detail-tour"]');
						if (detailLink) {
							const hrefMatch = detailLink.href.match(/id=(\d+)/);
							if (hrefMatch) return { id: hrefMatch[1] };
						}
					}
				}
				return null;
			});
			if (tourInfo) {
				tourId = tourInfo.id;
				tourUrl = `${BASE_URL}/detail-tour?id=${tourId}`;
			}
		} catch (e) {
			console.log(`  ⚠️ Lỗi tìm link tour: ${e.message}`);
		}

		if (!tourUrl) {
			// Fallback cuối: thử tìm bất kỳ link nào trỏ đến detail-tour
			tourUrl = await userPage.evaluate(() => {
				const link = document.querySelector('a[href*="/detail-tour"]');
				return link ? link.href : null;
			});
		}

		if (!tourUrl) {
			throw new Error("❌ Không tìm thấy tour Đà Nẵng nào trong danh sách");
		}
		console.log(`  Đã tìm thấy tour, URL: ${tourUrl}`);

		// Điều hướng đến trang chi tiết tour
		await userPage.goto(tourUrl, gotoOpts());
		await sleep(2000);

		// Chờ thông tin tour render
		try {
			await userPage.waitForSelector("#tour-name", { timeout: 8000 });
		} catch (e) {
			console.log("  ⚠️ #tour-name không xuất hiện, chờ thêm...");
			await sleep(3000);
		}
		await shot(userPage, "04-chi-tiet-tour");

		// Đọc và kiểm tra thông tin tour
		const tourName = await userPage
			.$eval("#tour-name", (el) => el.textContent.trim())
			.catch(() => "N/A");
		const tourPrice = await userPage
			.$eval("#tour-price", (el) => el.textContent.trim())
			.catch(() => "N/A");
		const tourDuration = await userPage
			.$eval("#tour-duration", (el) => el.textContent.trim())
			.catch(() => "N/A");
		const tourLocation = await userPage
			.$eval("#tour-location", (el) => el.textContent.trim())
			.catch(() => "N/A");

		console.log(`  => Tên tour: ${tourName}`);
		console.log(`  => Giá tour: ${tourPrice}`);
		console.log(`  => Thời lượng: ${tourDuration}`);
		console.log(`  => Địa điểm: ${tourLocation}`);

		if (tourName.includes("Đà Nẵng")) {
			console.log('  ✅ Kết quả: Hiển thị chi tiết tour thành công');
		} else {
			console.log('  ⚠️ Kết quả: Tên tour không chứa "Đà Nẵng"');
		}

		// ====================================================================
		// Bước 4: Nhấn Đặt Tour
		// Hành động: Nhấn Đặt Tour
		// Dữ liệu: Thông tin khách hàng hợp lệ
		// Kết quả mong muốn: Booking được tạo thành công
		// ====================================================================
		console.log("\n========== BƯỚC 4: NHẤN ĐẶT TOUR ==========");
		console.log('  --- Dữ liệu: Thông tin khách hàng hợp lệ ---');

		// Kiểm tra đã đăng nhập chưa
		const token = await userPage.evaluate(() => localStorage.getItem("token")).catch(() => null);
		if (!token) {
			await login(userPage, "ngocanh@gmail.com", "123456");
			await shot(userPage, "04b-sau-login");

			// Quay lại trang chi tiết tour
		await userPage.goto(tourUrl, gotoOpts());
			await sleep(2000);
			try {
				await userPage.waitForSelector("#tour-name", { timeout: 8000 });
			} catch (e) {
				await sleep(2000);
			}
			await shot(userPage, "04c-chi-tiet-tour-da-login");
		}

		// Nhấn nút Đặt Tour
		try {
			await userPage.waitForSelector("#bookTourBtn", { timeout: 8000 });
		} catch (e) {
			console.log("  ⚠️ #bookTourBtn không xuất hiện, chờ thêm...");
			await sleep(3000);
		}

		console.log("  --- Đang nhấn Đặt Tour ---");
		await Promise.all([
			userPage.waitForNavigation(gotoOpts()).catch(() => {}),
			userPage.click("#bookTourBtn"),
		]);
		await sleep(2000);

		// Chờ form booking hiển thị
		try {
			await userPage.waitForSelector("#booking-form", { timeout: 10000 });
		} catch (e) {
			console.log("  ⚠️ #booking-form không xuất hiện, chờ thêm...");
			await sleep(3000);
		}
		await shot(userPage, "05-trang-dat-tour");

		// Điền thông tin khách hàng hợp lệ
		await userPage.evaluate(() => {
			const dob = document.getElementById("contact_dob");
			if (dob) {
				if (dob._flatpickr) {
					dob._flatpickr.setDate("1990-01-01");
				} else {
					dob.value = "1990-01-01";
				}
			}

			const name = document.getElementById("contact_name");
			if (name && !name.value) name.value = "Đỗ Thị Ngọc Anh";

			const phone = document.getElementById("contact_phone");
			if (phone && !phone.value) phone.value = "0967123456";

			const email = document.getElementById("contact_email");
			if (email && !email.value) email.value = "ngocanh@gmail.com";
		});

		// Chọn ngày khởi hành
		const departureSelected = await userPage.evaluate(() => {
			const select = document.querySelector("#departure_id");
			if (!select) return false;
			const option = Array.from(select.options).find(
				(item) => item.value && item.value !== "",
			);
			if (!option) return false;
			select.value = option.value;
			select.dispatchEvent(new Event("change", { bubbles: true }));
			return true;
		});

		if (departureSelected) {
			console.log("  ✅ Đã chọn ngày khởi hành");
		} else {
			console.log("  ⚠️ Không có lịch khởi hành khả dụng");
		}

		await sleep(1500);
		await shot(userPage, "06-form-da-dien");

		// Gửi yêu cầu đặt tour
		console.log("\n  --- Gửi yêu cầu đặt tour ---");
		let bookingResponse = null;
		try {
			const responsePromise = userPage.waitForResponse(
				(response) =>
					response.url().includes("/api/bookings/create-payment-url") &&
					response.request().method() === "POST",
				{ timeout: 15000 },
			);
			await userPage.click("#submitBooking");
			bookingResponse = await responsePromise;
		} catch (e) {
			console.log(`  ⚠️ API booking timeout: ${e.message}`);
			await sleep(3000);
		}

		let bookingResult = null;
		if (bookingResponse) {
			try {
				bookingResult = await bookingResponse.json();
			} catch (e) {
				console.log(`  ⚠️ Không parse được response: ${e.message}`);
			}
		}

		if (bookingResult && bookingResult.vnpayUrl) {
			console.log("  ✅ Kết quả: Booking được tạo thành công (vnpayUrl đã được tạo)");
		} else {
			console.log("  ⚠️ Kết quả: Booking không trả về URL thanh toán");
		}
		await shot(userPage, "07-booking-thanh-cong");

		// ====================================================================
		// Bước 5: Kiểm tra thông tin tour
		// Hành động: Kiểm tra thông tin tour
		// Dữ liệu: Tên tour, giá tour
		// Kết quả mong muốn: Hiển thị chính xác thông tin tour
		// ====================================================================
		console.log("\n========== BƯỚC 5: KIỂM TRA THÔNG TIN TOUR ==========");
		console.log('  --- Dữ liệu: Tên tour, giá tour ---');

		const bookingTourName = await userPage
			.$eval("#tour-name-display", (el) => el.textContent.trim())
			.catch(() => "N/A");
		const bookingTotalAmount = await userPage
			.$eval("#total-amount", (el) => el.textContent.trim())
			.catch(() => "N/A");
		const bookingTourCode = await userPage
			.$eval("#tour-code", (el) => el.textContent.trim())
			.catch(() => "N/A");

		console.log(`  => Tên tour hiển thị: ${bookingTourName}`);
		console.log(`  => Giá tour hiển thị: ${bookingTotalAmount}`);
		console.log(`  => Mã tour: ${bookingTourCode}`);

		let step5Pass = true;
		if (bookingTourName.includes("Đà Nẵng")) {
			console.log('  ✅ Kết quả: Tên tour hiển thị chính xác (có "Đà Nẵng")');
		} else {
			console.log('  ⚠️ Kết quả: Tên tour không chứa "Đà Nẵng"');
			step5Pass = false;
		}

		if (bookingTotalAmount && bookingTotalAmount !== "0 ₫") {
			console.log(`  ✅ Kết quả: Giá tour hiển thị chính xác (${bookingTotalAmount})`);
		} else {
			console.log("  ⚠️ Kết quả: Giá tour không hợp lệ");
			step5Pass = false;
		}

		if (step5Pass) {
			console.log("  ✅ Kết quả: Hiển thị chính xác thông tin tour");
		}

		await shot(userPage, "08-ket-qua-cuoi-cung");

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
			const p = userPage || (await browser.newPage());
			await p.screenshot({
				path: path.join(DIR, "error.png"),
				fullPage: true,
			});
			console.log("  >> Đã chụp ảnh lỗi");
		} catch (e) {}
	} finally {
		try {
			if (userContext) await userContext.close();
			await browser.close();
		} catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
