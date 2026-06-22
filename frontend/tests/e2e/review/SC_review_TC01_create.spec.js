const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const DIR = path.resolve(__dirname, "screenshots", "TC01-create");
const BASE_URL = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let SCREEN_W = 1366, SCREEN_H = 768;
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

if (fs.existsSync(DIR)) fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1920, height: 1080 },
		args: ["--start-maximized"],
	});
	const page = await browser.newPage();
	let step = 0;
	const shot = async (name) => {
		step++;
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await page.setViewport({ width: SCREEN_W, height: SCREEN_H }).catch(() => {});
				await page.screenshot({
					path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
					fullPage: true,
				});
				console.log(`  >> Đã chụp: ${name}.png`);
				return;
			} catch (e) {
				const size = await page.evaluate(() => ({
					w: window.screen.availWidth,
					h: window.screen.availHeight,
				})).catch(() => ({ w: 0, h: 0 }));
				if (size.w > 0) { SCREEN_W = size.w; SCREEN_H = size.h; }
				await page.setViewport({ width: SCREEN_W, height: SCREEN_H }).catch(() => {});
				console.log(`  >> (thử ${attempt + 1}) ${e.message.substring(0, 60)}`);
				await sleep(2000);
			}
		}
	};

	try {
		// Bước 1: Đăng nhập nhung (có booking 80 đã kết thúc, chưa đánh giá)
		console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
		await page.goto(`${BASE_URL}/pages/auth/login.html`, { waitUntil: "domcontentloaded" });
		await page.waitForSelector("#loginForm");
		await page.type("#username", "nhung@gmail.com", { delay: 30 });
		await page.type("#password", "123456", { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, { timeout: 8000 });
		await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
		await sleep(1000);
		await shot("01-login-success");

		// Bước 2: Vào lịch sử đặt tour
		console.log("\n========== BƯỚC 2: LỊCH SỬ ĐẶT TOUR ==========");
		await page.goto(`${BASE_URL}/pages/user/bookings-history.html`, { waitUntil: "domcontentloaded" });
		await page.waitForFunction(
			() => document.querySelectorAll(".booking-item").length > 0,
			{ timeout: 10000 },
		);
		await sleep(1000);
		await shot("02-booking-history");

		// Bước 3: Vào chi tiết booking 80 (đã kết thúc, chưa đánh giá)
		console.log("\n========== BƯỚC 3: CHI TIẾT BOOKING ==========");
		await page.goto(`${BASE_URL}/pages/user/booking-details.html?id=80`, {
			waitUntil: "domcontentloaded",
			timeout: 20000,
		});
		await page.waitForSelector("#booking-actions", { timeout: 8000 });
		await sleep(2000);

		const reviewBtn = await page.$("#booking-actions .btn-warning");
		if (reviewBtn) {
			console.log('  ✅ Tìm thấy nút "Viết đánh giá"');
		}
		await shot("03-booking-detail");

		// Bước 4: Click "Viết đánh giá" → modal
		console.log("\n========== BƯỚC 4: MỞ MODAL ĐÁNH GIÁ ==========");
		if (reviewBtn) {
			await reviewBtn.click();
			await page.waitForSelector("#reviewModal.show, #reviewModal:not([style*='display: none'])", {
				timeout: 5000,
			});
			await sleep(1000);

			const defaultRating = await page.$eval("#review-rating-value", (el) => el.value);
			console.log(`  => Rating mặc định: ${defaultRating} sao`);
			await shot("04-review-modal-default");

			// Bước 5: Chọn 4 sao + nhập comment
			console.log("\n========== BƯỚC 5: NHẬP ĐÁNH GIÁ ==========");
			const stars = await page.$$(".star-btn");
			if (stars.length >= 4) {
				await stars[3].click();
				await sleep(300);

				const selectedRating = await page.$eval("#review-rating-value", (el) => el.value);
				const ratingText = await page.$eval("#rating-text", (el) => el.textContent).catch(() => "N/A");
				console.log(`  => Đã chọn: ${selectedRating} sao ("${ratingText}")`);

				await page.type("#review-comment", "Chuyến đi rất tuyệt vời!", { delay: 15 });
				await sleep(500);
				await shot("05-review-filled");

				// Bước 6: Click "Gửi đánh giá"
				console.log("\n========== BƯỚC 6: GỬI ĐÁNH GIÁ ==========");
				await page.click('#review-form button[type="submit"]');
				await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
				await sleep(2000);
				await shot("06-review-success");

				// Bước 7: Kiểm tra badge "Đã đánh giá"
				console.log("\n========== BƯỚC 7: KIỂM TRA BADGE ==========");
				const reviewedBadge = await page.$("#booking-actions span.badge");
				if (reviewedBadge) {
					const badgeText = await page.evaluate((el) => el.textContent, reviewedBadge);
					console.log(`  => Badge: "${badgeText.trim()}"`);
					if (badgeText.includes("Đã đánh giá")) console.log('  ✅ Badge "Đã đánh giá" hiển thị!');
				}
				const reviewBtnAgain = await page.$("#booking-actions .btn-warning");
				if (!reviewBtnAgain) console.log('  ✅ Nút "Viết đánh giá" đã biến mất');
				await shot("07-reviewed-badge");

				// Bước 8: Vào trang chi tiết tour → kiểm tra review
				console.log("\n========== BƯỚC 8: TRANG CHI TIẾT TOUR ==========");
				await page.goto(`${BASE_URL}/pages/user/detail-tour.html?id=8`, {
					waitUntil: "domcontentloaded",
				});
				await page.waitForSelector("#review-list", { timeout: 8000 });
				await sleep(1500);

				const foundReview = await page.evaluate(() => {
					const cards = document.querySelectorAll(".review-card");
					for (const card of cards) {
						if (card.textContent.includes("Chuyến đi rất tuyệt vời")) {
							return {
								name: card.querySelector("h6")?.textContent || "",
								comment: card.querySelector("p")?.textContent || "",
							};
						}
					}
					return null;
				});
				if (foundReview) {
					console.log(`  => Tên user: "${foundReview.name}"`);
					console.log(`  => Nội dung: "${foundReview.comment}"`);
					console.log("  ✅ Review hiển thị đúng trên trang tour!");
				} else {
					console.log("  => ⚠️ Không tìm thấy review vừa tạo (có thể đã ẩn sau nút 'Hiện tất cả')");
				}
				await shot("08-tour-review");
			}
		}

		console.log("\n============================================");
		console.log(`✅ TC01 REVIEW FLOW HOÀN TẤT - ${step} ảnh đã lưu`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		await sleep(10000);
	} catch (err) {
		console.error(`\n❌ LỖI: ${err.message}`);
		try { await page.screenshot({ path: path.join(DIR, "error.png"), fullPage: true }); } catch (e) {}
	} finally {
		try { await browser.close(); } catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
