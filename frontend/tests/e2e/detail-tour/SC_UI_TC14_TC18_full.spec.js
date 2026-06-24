const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "UI_TC14-TC18");
const URL = "http://localhost:3000/detail-tour?id=1";
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

let passCount = 0;
let failCount = 0;

function check(name, condition, detail) {
	if (condition) {
		passCount++;
		console.log(`  \u2705 [PASS] ${name}${detail ? ` \u2014 ${detail}` : ""}`);
	} else {
		failCount++;
		console.log(`  \u274c [FAIL] ${name}${detail ? ` \u2014 ${detail}` : ""}`);
	}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: ["--start-maximized"],
		executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
	});
	const page = await browser.newPage();
	let step = 0;

	const shotFull = async (name) => {
		step++;
		await page.screenshot({
			path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
			fullPage: true,
		});
		console.log(`  >> \ud83d\udcf8 Full page: ${name}.png`);
	};

	const shotEl = async (el, name) => {
		if (!el) return;
		step++;
		try {
			await el.screenshot({
				path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
			});
			console.log(`  >> \ud83d\udcf8 Element: ${name}.png`);
		} catch (e) {
			await sleep(500);
			await el.screenshot({
				path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
			});
			console.log(`  >> \ud83d\udcf8 Element: ${name}.png`);
		}
	};

	// ========================================================================
	// MỞ TRANG CHI TIẾT TOUR
	// ========================================================================
	console.log("\n========== MỞ TRANG CHI TIẾT TOUR ==========");
	await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
	await sleep(2500);
	console.log("  -> Trang chi tiết tour đã tải xong");
	await shotFull("00-detail-tour-full");

	// ========================================================================
	// TC_UI_14: Kiểm tra thông tin tổng quan tour
	// ========================================================================
	console.log("\n========== TC_UI_14: Kiểm tra thông tin tổng quan tour ==========");
	const headerCard = await page.$(".header-card");
	check("Có header card tổng quan", !!headerCard);

	if (headerCard) {
		const tourName = await page.$("#tour-name");
		check("Có tên tour", !!tourName);
		if (tourName) {
			const nameText = await page.evaluate((el) => el.textContent.trim(), tourName);
			check("Tên tour không rỗng", nameText.length > 0, nameText);
		}

		const tourLocation = await page.$("#tour-location");
		check("Có địa điểm", !!tourLocation);
		if (tourLocation) {
			const locText = await page.evaluate((el) => el.textContent.trim(), tourLocation);
			check("Địa điểm không rỗng", locText.length > 0, locText);
		}

		const tourDuration = await page.$("#tour-duration");
		check("Có thời lượng", !!tourDuration);
		if (tourDuration) {
			const durText = await page.evaluate((el) => el.textContent.trim(), tourDuration);
			check("Thời lượng không rỗng", durText.length > 0, durText);
		}

		const tourRegion = await page.$("#tour-region");
		check("Có khu vực", !!tourRegion);
		if (tourRegion) {
			const regText = await page.evaluate((el) => el.textContent.trim(), tourRegion);
			check("Khu vực không rỗng", regText.length > 0, regText);
		}

		const statusBadge = await headerCard.$(".badge");
		check("Có trạng thái tour", !!statusBadge);
		if (statusBadge) {
			const statusText = await page.evaluate((el) => el.textContent.trim(), statusBadge);
			check("Trạng thái hiển thị", statusText.length > 0, statusText);
		}

		const breadcrumbName = await page.$("#breadcrumb-tour-name");
		check("Breadcrumb có tên tour", !!breadcrumbName);
		if (breadcrumbName) {
			const breadText = await page.evaluate((el) => el.textContent.trim(), breadcrumbName);
			check("Tên tour trong breadcrumb không rỗng", breadText.length > 0, breadText);
		}
	}

	await shotEl(headerCard, "14-header-overview");

	// ========================================================================
	// TC_UI_15: Kiểm tra thư viện hình ảnh tour
	// ========================================================================
	console.log("\n========== TC_UI_15: Kiểm tra thư viện hình ảnh tour ==========");
	const gallery = await page.$("#tour-gallery");
	check("Có thư viện hình ảnh", !!gallery);

	await page.evaluate(() => window.scrollTo(0, 0));
	await sleep(300);

	const galleryImgs = await page.$$("#tour-gallery img");
	check("Có ít nhất 1 hình ảnh", galleryImgs.length > 0, `Tìm thấy ${galleryImgs.length} ảnh`);

	for (let i = 0; i < Math.min(galleryImgs.length, 5); i++) {
		const src = await page.evaluate((el) => el.getAttribute("src"), galleryImgs[i]);
		check(`Ảnh ${i + 1} có đường dẫn`, !!src && src.length > 0, src ? src.substring(0, 60) : "");
	}

	await sleep(1000);
	const freshGallery = await page.$("#tour-gallery");
	await shotEl(freshGallery || gallery, "15-tour-gallery");

	// ========================================================================
	// TC_UI_16: Kiểm tra lịch trình chi tiết
	// ========================================================================
	console.log("\n========== TC_UI_16: Kiểm tra lịch trình chi tiết ==========");
	await page.evaluate(() => {
		const el = document.getElementById("itinerary");
		if (el) el.scrollIntoView({ block: "start" });
	});
	await sleep(500);

	const itinerarySection = await page.$("#itinerary");
	check("Có mục lịch trình", !!itinerarySection);

	const itineraryList = await page.$("#itinerary-list");
	check("Có danh sách lịch trình", !!itineraryList);

	const itineraryItems = await page.$$("#itinerary-list .itinerary-item");
	check("Có ít nhất 1 ngày trong lịch trình", itineraryItems.length > 0, `Tìm thấy ${itineraryItems.length} ngày`);

	for (let i = 0; i < Math.min(itineraryItems.length, 3); i++) {
		const item = itineraryItems[i];
		const hasDayNum = await item.$(".itinerary-number");
		check(`Ngày ${i + 1} có số ngày`, !!hasDayNum);
		const titleEl = await item.$("h5");
		if (titleEl) {
			const titleText = await page.evaluate((el) => el.textContent.trim(), titleEl);
			check(`Ngày ${i + 1} có tiêu đề`, titleText.length > 0, titleText);
		}
		const contentEl = await item.$(".itinerary-content");
		check(`Ngày ${i + 1} có nội dung`, !!contentEl);
	}

	await shotEl(itinerarySection || itineraryList, "16-itinerary");

	// ========================================================================
	// TC_UI_17: Kiểm tra bảng giá và nút "Đặt tour ngay"
	// ========================================================================
	console.log("\n========== TC_UI_17: Kiểm tra bảng giá và nút Đặt tour ngay ==========");
	const bookingCard = await page.$(".booking-card");
	check("Có khung giá", !!bookingCard);

	const priceEl = await page.$("#tour-price");
	check("Có giá tour", !!priceEl);
	if (priceEl) {
		const priceText = await page.evaluate((el) => el.textContent.trim(), priceEl);
		check("Giá tour không rỗng", priceText.length > 0, priceText);
	}

	const adultPriceSummary = await page.$("#tour-price-summary");
	check("Có giá người lớn", !!adultPriceSummary);
	if (adultPriceSummary) {
		const adultText = await page.evaluate((el) => el.textContent.trim(), adultPriceSummary);
		check("Giá người lớn không rỗng", adultText.length > 0, adultText);
	}

	const childPriceSummary = await page.$("#tour-price-child-summary");
	check("Có giá trẻ em", !!childPriceSummary);
	if (childPriceSummary) {
		const childText = await page.evaluate((el) => el.textContent.trim(), childPriceSummary);
		check("Giá trẻ em không rỗng", childText.length > 0, childText);
	}

	const bookBtn = await page.$("#bookTourBtn");
	check("Có nút Đặt tour ngay", !!bookBtn);
	if (bookBtn) {
		const btnText = await page.evaluate((el) => el.textContent.trim(), bookBtn);
		check("Nút có text hiển thị", btnText.length > 0, btnText);
		const isVisible = await page.evaluate((el) => {
			const r = el.getBoundingClientRect();
			return r.width > 0 && r.height > 0;
		}, bookBtn);
		check("Nút hiển thị trên giao diện", isVisible);
	}

	const hotlineLink = await page.$(".btn-hotline-pill, .hotline-premium a");
	check("Có hotline hỗ trợ", !!hotlineLink);

	await page.evaluate(() => {
		const el = document.querySelector(".booking-card-wrapper");
		if (el) el.scrollIntoView({ block: "center" });
	});
	await sleep(300);
	const freshBookingCard = await page.$(".booking-card");
	await shotEl(freshBookingCard || bookingCard, "17-booking-sidebar");

	// ========================================================================
	// TC_UI_18: Kiểm tra tiện ích, dịch vụ và đánh giá khách hàng
	// ========================================================================
	console.log("\n========== TC_UI_18: Kiểm tra tiện ích, dịch vụ và đánh giá ==========");

	await page.evaluate(() => {
		const el = document.getElementById("services");
		if (el) el.scrollIntoView({ block: "start" });
	});
	await sleep(500);

	const servicesSection = await page.$("#services");
	check("Có mục dịch vụ", !!servicesSection);

	const serviceList = await page.$("#service-list");
	check("Có danh sách dịch vụ", !!serviceList);

	const serviceCards = await page.$$("#service-list .service-card");
	check("Có ít nhất 1 dịch vụ", serviceCards.length > 0, `Tìm thấy ${serviceCards.length} dịch vụ`);

	if (serviceCards.length > 0) {
		for (let i = 0; i < Math.min(serviceCards.length, 4); i++) {
			const sc = serviceCards[i];
			const nameEl = await sc.$("h6");
			if (nameEl) {
				const sName = await page.evaluate((el) => el.textContent.trim(), nameEl);
				check(`Dịch vụ ${i + 1} có tên`, sName.length > 0, sName);
			}
			const descEl = await sc.$("p");
			if (descEl) {
				const sDesc = await page.evaluate((el) => el.textContent.trim(), descEl);
				check(`Dịch vụ ${i + 1} có mô tả`, sDesc.length > 0);
			}
			const iconEl = await sc.$(".icon-box i, .icon-box");
			check(`Dịch vụ ${i + 1} có icon`, !!iconEl);
		}
	}

	const freshServices = await page.$("#services");
	await shotEl(freshServices || servicesSection, "18-services");

	await page.evaluate(() => {
		const el = document.getElementById("reviews");
		if (el) el.scrollIntoView({ block: "start" });
	});
	await sleep(500);

	const reviewsSection = await page.$("#reviews");
	check("Có mục đánh giá", !!reviewsSection);

	const avgRating = await page.$("#avg-rating-text");
	check("Có đánh giá trung bình", !!avgRating);
	if (avgRating) {
		const ratingText = await page.evaluate((el) => el.textContent.trim(), avgRating);
		check("Điểm đánh giá không rỗng", ratingText.length > 0, ratingText);
	}

	const avgRatingBadge = await page.$("#avg-rating-text");
	check("Có badge đánh giá trung bình", !!avgRatingBadge);
	if (avgRatingBadge) {
		const badgeText = await page.evaluate((el) => el.textContent.trim(), avgRatingBadge);
		check("Badge đánh giá có nội dung", badgeText.length > 0, badgeText);
	}

	const reviewList = await page.$("#review-list");
	check("Có danh sách đánh giá", !!reviewList);

	const reviewCards = await page.$$("#review-list .review-card, #review-list .review-item-wrapper, .review-card");
	check("Có ít nhất 1 đánh giá", reviewCards.length > 0, `Tìm thấy ${reviewCards.length} đánh giá`);

	if (reviewCards.length > 0) {
		for (let i = 0; i < Math.min(reviewCards.length, 2); i++) {
			const rc = reviewCards[i];
			const userName = await rc.$("h6");
			if (userName) {
				const uText = await page.evaluate((el) => el.textContent.trim(), userName);
				check(`Đánh giá ${i + 1} có tên người dùng`, uText.length > 0, uText);
			}
			const stars = await rc.$$(".text-warning");
			check(`Đánh giá ${i + 1} có sao`, stars.length > 0);
			const comment = await rc.$("p");
			if (comment) {
				const cText = await page.evaluate((el) => el.textContent.trim(), comment);
				check(`Đánh giá ${i + 1} có nội dung`, cText.length > 0);
			}
		}
	}

	const showAllBtn = await page.$("#show-all-reviews");
	check("Có nút xem tất cả đánh giá", !!showAllBtn);

	await page.evaluate(() => {
		const el = document.getElementById("reviews");
		if (el) el.scrollIntoView({ block: "center" });
	});
	await sleep(500);
	const freshReviews = await page.$("#reviews");
	await shotEl(freshReviews, "18-reviews");

	// ========================================================================
	// SUMMARY
	// ========================================================================
	console.log("\n============================================");
	console.log(`\u2705 TC HOÀN TẤT \u2014 ${passCount} PASS / ${failCount} FAIL / ${step} ảnh`);
	console.log(`\ud83d\udcc1 Thư mục: ${DIR}`);
	console.log("============================================\n");

	console.log("Trình duyệt sẽ đóng sau 10 giây...");
	await sleep(10000);
	await browser.close();
})();
