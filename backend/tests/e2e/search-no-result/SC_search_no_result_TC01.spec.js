const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC01-search-no-result");
const BASE_URL = "http://localhost:3000";
const DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "12345",
	database: "db_viet_tour",
	port: 3306,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ trước khi chạy
if (fs.existsSync(DIR)) {
	fs.rmSync(DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIR, { recursive: true });

(async () => {
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

	// Chờ trang load xong: #tour-list không còn spinner loading
	const waitForListReady = async (page) => {
		try {
			await page.waitForFunction(
				() => {
					const el = document.querySelector("#tour-list");
					if (!el) return false;
					const text = el.innerText;
					return !text.includes("Đang tải") && !text.includes("Loading") && !text.includes("spinner");
				},
				{ timeout: 15000 },
			);
		} catch (e) {
			console.log("  ⚠️ Chờ list ready timeout, chụp luôn...");
		}
		await sleep(1000);
	};

	const gotoOpts = (wait) => ({
		waitUntil: wait || "domcontentloaded",
		timeout: 30000,
	});

	let page;

	try {
		// ====================================================================
		// Bước 1: Truy cập trang tìm kiếm
		// Hành động: Truy cập URL Website
		// Kết quả mong muốn: Hiển thị form tìm kiếm
		// ====================================================================
		console.log("\n========== BƯỚC 1: TRUY CẬP TRANG TÌM KIẾM ==========");
		page = await browser.newPage();

		await page.goto(`${BASE_URL}/pages/user/list-tour.html`, gotoOpts());

		// Chờ form tìm kiếm hiển thị
		try {
			await page.waitForSelector("#searchInput", { timeout: 8000 });
		} catch (e) {
			console.log("  ⚠️ Không tìm thấy #searchInput, chờ thêm...");
			await sleep(3000);
		}

		// Chờ danh sách tour load xong (hết spinner loading)
		await waitForListReady(page);
		await shot(page, "01-trang-tim-kiem");

		const hasSearchInput = await page.$("#searchInput") !== null;
		if (hasSearchInput) {
			console.log("  ✅ Kết quả: Hiển thị form tìm kiếm thành công");
		} else {
			console.log("  ⚠️ Kết quả: Không tìm thấy form tìm kiếm");
		}

		// ====================================================================
		// Bước 2: Nhập từ khóa ABCXYZ123
		// Hành động: Nhập từ khóa
		// Dữ liệu: ABCXYZ123
		// Kết quả mong muốn: Không tìm thấy tour
		// ====================================================================
		console.log("\n========== BƯỚC 2: NHẬP TỪ KHÓA ABCXYZ123 ==========");
		console.log('  --- Dữ liệu: "ABCXYZ123" ---');

		await page.click("#searchInput");
		await sleep(300);
		await page.type("#searchInput", "ABCXYZ123", { delay: 30 });

		// Chờ API tìm kiếm trả về
		try {
			await page.waitForResponse(
				(response) =>
					response.url().includes("/api/list-tours") &&
					response.request().method() === "GET",
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  ⚠️ API search timeout, chờ DOM...");
		}

		// Chờ DOM cập nhật kết quả (hết loading spinner)
		await waitForListReady(page);
		await shot(page, "02-nhap-tu-khoa");

		// Kiểm tra kết quả: không tìm thấy tour
		let noResultFound = false;
		try {
			noResultFound = await page.evaluate(() => {
				const container = document.querySelector("#tour-list");
				if (!container) return false;
				const text = container.innerText;
				return (
					text.includes("Không tìm thấy") ||
					text.includes("không tìm thấy") ||
					text.includes("no results") ||
					text.includes("No results") ||
					text.includes("không có kết quả") ||
					text.includes("Không có kết quả") ||
					text.includes("Rất tiếc")
				);
			});
		} catch (e) {
			console.log(`  ⚠️ Lỗi kiểm tra kết quả: ${e.message}`);
		}

		if (noResultFound) {
			console.log('  ✅ Kết quả: Không tìm thấy tour (hiển thị thông báo phù hợp)');
		} else {
			console.log('  ⚠️ Kết quả: Không thấy thông báo "Không tìm thấy"');
		}

		// ====================================================================
		// Bước 3: Nhấn Tìm kiếm (gõ lại và chờ kết quả)
		// Hành động: Nhấn Tìm kiếm
		// Dữ liệu: ABCXYZ123
		// Kết quả mong muốn: Hiển thị thông báo phù hợp
		// ====================================================================
		console.log("\n========== BƯỚC 3: KIỂM TRA THÔNG BÁO ==========");
		console.log('  --- Dữ liệu: "ABCXYZ123" ---');

		// Xóa input và gõ lại để trigger tìm kiếm lần nữa
		await page.click("#searchInput", { clickCount: 3 });
		await sleep(200);
		await page.type("#searchInput", "ABCXYZ123", { delay: 30 });

		// Chờ API tìm kiếm trả về
		try {
			await page.waitForResponse(
				(response) =>
					response.url().includes("/api/list-tours") &&
					response.request().method() === "GET",
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  ⚠️ API search timeout lần 2, chờ DOM...");
		}

		// Chờ DOM cập nhật hoàn tất
		await waitForListReady(page);

		// Đọc nội dung thông báo
		let notificationText = "";
		try {
			notificationText = await page.evaluate(() => {
				const container = document.querySelector("#tour-list");
				return container ? container.innerText.trim() : "";
			});
		} catch (e) {
			console.log(`  ⚠️ Lỗi đọc thông báo: ${e.message}`);
		}
		await shot(page, "03-thong-bao-khong-tim-thay");

		if (notificationText) {
			console.log(`  => Nội dung thông báo: "${notificationText.substring(0, 200)}"`);
			if (
				notificationText.includes("Không tìm thấy") ||
				notificationText.includes("không tìm thấy") ||
				notificationText.includes("Rất tiếc") ||
				notificationText.includes("không có kết quả")
			) {
				console.log("  ✅ Kết quả: Hiển thị thông báo phù hợp khi không tìm thấy tour");
			} else {
				console.log("  ⚠️ Kết quả: Thông báo không đúng như mong đợi");
			}
		} else {
			console.log("  ⚠️ Kết quả: Không có thông báo nào hiển thị");
		}

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
			await p.screenshot({
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
