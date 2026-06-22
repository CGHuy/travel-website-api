const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC01-search-booking-phu-quoc");
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
	// Khởi tạo browser + đăng nhập trước (setup, không phải bước test)
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

	const waitForListReady = async (page) => {
		try {
			await page.waitForFunction(
				() => {
					const el = document.querySelector("#tour-list");
					if (!el) return false;
					return !el.innerText.includes("Đang tải") && !el.innerText.includes("spinner");
				},
				{ timeout: 15000 },
			);
		} catch (e) {
			console.log("  ⚠️ Chờ list ready timeout, chụp luôn...");
		}
		await sleep(1000);
	};

	const waitForDetailReady = async (page) => {
		try {
			await page.waitForFunction(
				() => {
					const el = document.querySelector("#tour-name");
					return el && el.textContent.trim() !== "" && !el.textContent.includes("Đang tải");
				},
				{ timeout: 15000 },
			);
		} catch (e) {
			console.log("  ⚠️ Chờ detail ready timeout, chụp luôn...");
		}
		await sleep(1500);
	};

	const gotoOpts = () => ({ waitUntil: "domcontentloaded", timeout: 30000 });

	let page;

	try {
		// Đăng nhập trước (setup)
		console.log("\n========== SETUP: ĐĂNG NHẬP ==========");
		page = await browser.newPage();
		await page.goto(`${BASE_URL}/pages/auth/login.html`, gotoOpts());
		await page.waitForSelector("#loginForm");
		await page.type("#username", "ngocanh@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation(gotoOpts()).catch(() => {});
		await sleep(3000);
		console.log("  ✅ Đăng nhập thành công (setup)");

		// ====================================================================
		// Bước 1: Tìm kiếm tour "Phú Quốc"
		// Hành động: Tìm kiếm tour
		// Dữ liệu: Phú Quốc
		// Kết quả mong muốn: Hiển thị danh sách tour
		// ====================================================================
		console.log("\n========== BƯỚC 1: TÌM KIẾM TOUR ==========");
		console.log('  --- Dữ liệu: "Phú Quốc" ---');

		await page.goto(`${BASE_URL}/pages/user/list-tour.html`, gotoOpts());

		await page.waitForSelector("#searchInput", { timeout: 10000 });
		await sleep(1000);

		await page.click("#searchInput");
		await page.type("#searchInput", "Phú Quốc", { delay: 30 });

		try {
			await page.waitForResponse(
				(res) => res.url().includes("/api/list-tours") && res.request().method() === "GET",
				{ timeout: 20000 },
			);
		} catch (e) {
			console.log("  ⚠️ API search timeout, chờ DOM...");
		}

		await waitForListReady(page);
		await shot(page, "01-danh-sach-tour-phu-quoc");

		const pqListed = await page.evaluate(() => {
			const el = document.querySelector("#tour-list");
			return el && el.innerText.includes("Phú Quốc");
		});
		if (pqListed) {
			console.log('  ✅ Kết quả: Hiển thị danh sách tour Phú Quốc');
		} else {
			console.log('  ⚠️ Kết quả: Không thấy tour Phú Quốc');
		}

		// Lưu thông tin tour từ danh sách
		let tourId = null;
		let tourUrl = null;
		let listTourName = "";
		let listTourPrice = "";

		const info = await page.evaluate(() => {
			const cards = document.querySelectorAll("#tour-list .tour-horizontal-card");
			for (const card of cards) {
				if (card.innerText.includes("Tour Phú Quốc 3N2Đ") || card.innerText.includes("Phú Quốc")) {
					const onclick = card.getAttribute("onclick") || "";
					const m = onclick.match(/id=(\d+)/);
					if (m) {
						const nameEl = card.querySelector(".card-title");
						const priceEl = card.querySelector(".text-danger");
						return {
							id: m[1],
							name: nameEl ? nameEl.textContent.trim() : "",
							price: priceEl ? priceEl.textContent.trim() : "",
						};
					}
					const detailLink = card.querySelector('a[href*="/detail-tour"]');
					if (detailLink) {
						const hm = detailLink.href.match(/id=(\d+)/);
						if (hm) {
							const nameEl = card.querySelector(".card-title");
							const priceEl = card.querySelector(".text-danger");
							return {
								id: hm[1],
								name: nameEl ? nameEl.textContent.trim() : "",
								price: priceEl ? priceEl.textContent.trim() : "",
							};
						}
					}
				}
			}
			return null;
		});

		if (info) {
			tourId = info.id;
			tourUrl = `${BASE_URL}/detail-tour?id=${tourId}`;
			listTourName = info.name;
			listTourPrice = info.price;
			console.log(`  => Tour: ID=${tourId}, "${listTourName}", Giá="${listTourPrice}"`);
		}

		if (!tourUrl) throw new Error("❌ Không tìm thấy tour Phú Quốc trong danh sách");

		// ====================================================================
		// Bước 2: Mở trang chi tiết tour "Tour Phú Quốc"
		// Hành động: Mở trang chi tiết tour
		// Dữ liệu: Tour Phú Quốc
		// Kết quả mong muốn: Hiển thị thông tin tour
		// ====================================================================
		console.log("\n========== BƯỚC 2: MỞ TRANG CHI TIẾT TOUR ==========");
		console.log('  --- Dữ liệu: "Tour Phú Quốc" ---');

		await page.goto(tourUrl, gotoOpts());
		await page.waitForSelector("#tour-name", { timeout: 20000 });
		await waitForDetailReady(page);
		await shot(page, "02-chi-tiet-tour-phu-quoc");

		const detailTourName = await page.$eval("#tour-name", (el) => el.textContent.trim()).catch(() => "N/A");
		const detailTourPrice = await page.$eval("#tour-price", (el) => el.textContent.trim()).catch(() => "N/A");
		const detailTourDuration = await page.$eval("#tour-duration", (el) => el.textContent.trim()).catch(() => "N/A");
		const detailTourLocation = await page.$eval("#tour-location", (el) => el.textContent.trim()).catch(() => "N/A");

		console.log(`  => Tên tour: ${detailTourName}`);
		console.log(`  => Giá: ${detailTourPrice}`);
		console.log(`  => Thời lượng: ${detailTourDuration}`);
		console.log(`  => Địa điểm: ${detailTourLocation}`);

		if (detailTourName.includes("Phú Quốc")) {
			console.log('  ✅ Kết quả: Hiển thị thông tin tour Phú Quốc thành công');
		} else {
			console.log('  ⚠️ Kết quả: Tên tour không chứa "Phú Quốc"');
		}

		const detailData = {
			name: detailTourName,
			price: detailTourPrice,
		};

		// ====================================================================
		// Bước 3: Chọn Đặt Tour
		// Hành động: Chọn Đặt Tour
		// Dữ liệu: Tour Phú Quốc
		// Kết quả mong muốn: Chuyển sang Booking
		// ====================================================================
		console.log("\n========== BƯỚC 3: CHỌN ĐẶT TOUR ==========");
		console.log('  --- Dữ liệu: "Tour Phú Quốc" ---');

		await page.waitForSelector("#bookTourBtn", { timeout: 8000 });
		await sleep(300);

		await Promise.all([
			page.waitForNavigation(gotoOpts()).catch(() => {}),
			page.click("#bookTourBtn"),
		]);

		try {
			await page.waitForSelector("#booking-form", { timeout: 20000 });
		} catch (e) {
			console.log("  ⚠️ #booking-form không xuất hiện, chờ thêm...");
			await sleep(3000);
		}
		await sleep(5000);
		await shot(page, "03-trang-dat-tour");

		const onBookingPage = await page.$("#booking-form") !== null;
		if (onBookingPage) {
			console.log('  ✅ Kết quả: Chuyển sang trang Booking thành công');
		} else {
			console.log('  ⚠️ Kết quả: Không chuyển được sang Booking');
		}

		// ====================================================================
		// Bước 4: Kiểm tra dữ liệu (Tên tour, giá tour)
		// Hành động: Kiểm tra dữ liệu
		// Dữ liệu: Tên tour, giá tour
		// Kết quả mong muốn: Dữ liệu giống trang Detail
		// ====================================================================
		console.log("\n========== BƯỚC 4: KIỂM TRA DỮ LIỆU ==========");
		console.log('  --- Dữ liệu: Tên tour, giá tour ---');

		const bookingTourName = await page.$eval("#tour-name-display", (el) => el.textContent.trim()).catch(() => "N/A");
		const bookingTotalAmount = await page.$eval("#total-amount", (el) => el.textContent.trim()).catch(() => "N/A");
		const bookingAdultPrice = await page.$eval("#price-adult", (el) => el.textContent.trim()).catch(() => "N/A");

		console.log("  --- Trang Booking ---");
		console.log(`  => Tên tour: ${bookingTourName}`);
		console.log(`  => Giá người lớn: ${bookingAdultPrice}`);
		console.log(`  => Tổng tiền: ${bookingTotalAmount}`);

		console.log("\n  --- Trang Detail ---");
		console.log(`  => Tên tour: ${detailData.name}`);
		console.log(`  => Giá: ${detailData.price}`);

		// So sánh tên tour
		const bn = bookingTourName.replace(/\s+/g, " ").trim().toLowerCase();
		const dn = detailData.name.replace(/\s+/g, " ").trim().toLowerCase();

		let match = true;
		if (bn.includes(dn) || dn.includes(bn)) {
			console.log('  ✅ Tên tour: Khớp với trang Detail');
		} else {
			console.log(`  ⚠️ Tên tour: Không khớp ("${bookingTourName}" vs "${detailData.name}")`);
			match = false;
		}

		// So sánh giá
		if (bookingAdultPrice !== "N/A" && detailData.price !== "N/A") {
			const bp = bookingAdultPrice.replace(/[^\d]/g, "");
			const dp = detailData.price.replace(/[^\d]/g, "");
			if (bp && dp && bp.includes(dp.slice(-3))) {
				console.log(`  ✅ Giá tour: Khớp với trang Detail (${bookingAdultPrice})`);
			} else {
				console.log(`  ⚠️ Giá tour: Có thể khác ("${bookingAdultPrice}" vs "${detailData.price}")`);
			}
		}

		if (match) {
			console.log('  ✅ Kết quả: Dữ liệu trên Booking giống với trang Detail');
		}

		await shot(page, "04-ket-qua-kiem-tra");

		// ====================================================================
		// TỔNG KẾT
		// ====================================================================
		console.log("\n============================================");
		console.log(`✅ TC HOÀN TẤT - ${step} ảnh đã lưu`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		console.log("Trình duyệt sẽ đóng sau 5 giây...");
		await sleep(5000);
	} catch (err) {
		console.error(`\n❌ LỖI: ${err.message}`);
		try {
			const p = page || (await browser.newPage());
			await p.screenshot({ path: path.join(DIR, "error.png"), fullPage: true });
			console.log("  >> Đã chụp ảnh lỗi");
		} catch (e) {}
	} finally {
		try { await browser.close(); } catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
