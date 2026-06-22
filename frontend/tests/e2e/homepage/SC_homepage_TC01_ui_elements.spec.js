const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "TC01-ui-elements");
const URL = "http://localhost:3000";
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

let passCount = 0;
let failCount = 0;

function check(name, condition, detail) {
	if (condition) {
		passCount++;
		console.log(`  ✅ [PASS] ${name}${detail ? ` — ${detail}` : ""}`);
	} else {
		failCount++;
		console.log(`  ❌ [FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
	}
}

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
			console.log(`  >> 📸 Đã chụp: ${name}.png`);
		} catch (e) {
			await sleep(2000);
			await page.screenshot({
				path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
				fullPage: true,
			});
			console.log(`  >> 📸 Đã chụp (lần 2): ${name}.png`);
		}
	};

	try {
		// ========================================================================
		// MỞ TRANG CHỦ
		// ========================================================================
		console.log("\n========== MỞ TRANG CHỦ ==========");
		await page.goto(`${URL}/pages/index.html`, {
			waitUntil: "networkidle0",
			timeout: 30000,
		});
		console.log("  -> Trang chủ đã tải xong");
		await shot("00-homepage-full");

		// ========================================================================
		// TC01: Hero Banner
		// ========================================================================
		console.log("\n--- TC01: Kiểm tra Hero Banner ---");
		const heroCarousel = await page.$("#heroCarousel");
		check("Hero Carousel tồn tại", !!heroCarousel);

		const heroSlides = await page.$$("#heroCarousel .carousel-item");
		check("Hero Carousel có 3 slide", heroSlides.length === 3, `Tìm thấy ${heroSlides.length} slide`);

		if (heroSlides.length > 0) {
			for (let i = 0; i < heroSlides.length; i++) {
				const img = await heroSlides[i].$("img");
				const caption = await heroSlides[i].$(".carousel-caption");
				check(`Slide ${i + 1} có ảnh`, !!img);
				check(`Slide ${i + 1} có caption`, !!caption);
			}
		}
		await shot("01-hero-banner");

		// ========================================================================
		// TC02: Thông tin nổi bật
		// ========================================================================
		console.log("\n--- TC02: Kiểm tra Thông tin nổi bật ---");
		const featureSection = await page.$(".info-features-section");
		check("Info Features Section tồn tại", !!featureSection);

		const featureItems = await page.$$(".info-features-section .feature-item");
		check("Có đúng 3 feature items", featureItems.length === 3, `Tìm thấy ${featureItems.length} items`);

		for (let i = 0; i < featureItems.length; i++) {
			const icon = await featureItems[i].$("i.feature-icon");
			const title = await featureItems[i].$(".feature-title");
			const text = await featureItems[i].$(".feature-text");
			check(`Feature item ${i + 1} có icon`, !!icon);
			check(`Feature item ${i + 1} có title`, !!title);
			check(`Feature item ${i + 1} có text`, !!text);
		}
		await shot("02-info-features");

		// ========================================================================
		// TC03: Danh mục vùng miền
		// ========================================================================
		console.log("\n--- TC03: Kiểm tra Danh mục vùng miền ---");
		const regionSection = await page.$("#region-categories");
		check("Region Categories section tồn tại", !!regionSection);

		const regionCards = await page.$$("#region-categories .region-category-card");
		check("Có đúng 3 region cards", regionCards.length === 3, `Tìm thấy ${regionCards.length} cards`);

		const cardBac = await page.$("#cardMienBac");
		const cardTrung = await page.$("#cardMienTrung");
		const cardNam = await page.$("#cardMienNam");
		check("Card Miền Bắc tồn tại", !!cardBac);
		check("Card Miền Trung tồn tại", !!cardTrung);
		check("Card Miền Nam tồn tại", !!cardNam);

		for (let i = 0; i < regionCards.length; i++) {
			const overlay = await regionCards[i].$(".top-tour-overlay");
			check(`Region card ${i + 1} có overlay`, !!overlay);
		}
		await shot("03-region-categories");

		// ========================================================================
		// TC04: Top Tours nổi bật
		// ========================================================================
		console.log("\n--- TC04: Kiểm tra Top Tours nổi bật ---");
		const topSection = await page.$(".top-featured-section");
		check("Top Featured Section tồn tại", !!topSection);

		const topTitle = await page.$(".top-section-title");
		check("Top Featured có tiêu đề", !!topTitle);

		const topCarousel = await page.$("#topFeaturedCarousel");
		check("Top Featured Carousel tồn tại", !!topCarousel);

		// Đợi API load tours (nếu có loading spinner, chờ nó biến mất)
		try {
			await page.waitForFunction(
				() => {
					const spinner = document.querySelector("#loadingTopFeatured");
					return !spinner || spinner.style.display === "none" || spinner.classList.contains("d-none");
				},
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  -> Spinner loading có thể không biến mất trong 10s");
		}
		await sleep(2000);

		const topTourCards = await page.$$("#carouselTopFeatured .top-tour-card");
		check("Top Tours có tour cards", topTourCards.length > 0, `Tìm thấy ${topTourCards.length} tour cards`);

		if (topTourCards.length > 0) {
			const cardImg = await topTourCards[0].$("img.tour-main-img");
			check("Tour card đầu tiên có ảnh", !!cardImg);

			const cardPrice = await topTourCards[0].$(".card-price, .hightlight_price");
			check("Tour card đầu tiên có giá", !!cardPrice);

			const cardLink = await topTourCards[0].$('a[href*="detail-tour"]');
			check("Tour card đầu tiên có link detail", !!cardLink);
		}

		const carouselCtrls = await page.$$(".custom-carousel-controls .btn-carousel-ctrl");
		check("Top Featured có controls (prev/next)", carouselCtrls.length >= 2);
		await shot("04-top-featured-tours");

		// ========================================================================
		// TC05: Tour theo vùng miền
		// ========================================================================
		console.log("\n--- TC05: Kiểm tra Tour theo vùng miền ---");
		const regionBlocks = await page.$$(".region-block");
		check("Có đúng 3 region blocks", regionBlocks.length === 3, `Tìm thấy ${regionBlocks.length} blocks`);

		const regionIds = ["MienBac", "MienTrung", "MienNam"];
		const regionNames = ["Miền Bắc", "Miền Trung", "Miền Nam"];

		for (let i = 0; i < regionIds.length; i++) {
			const title = await page.$(`#carousel${regionIds[i]} .region-title`);
			check(`Region ${regionNames[i]} có tiêu đề`, !!title);

			const carouselInner = await page.$(`#${regionIds[i]}Carousel`);
			check(`Region ${regionNames[i]} có carousel inner`, !!carouselInner);

			// Đợi tours load
			try {
				await page.waitForFunction(
					(id) => {
						const sp = document.querySelector(`#loading${id}`);
						return !sp || sp.style.display === "none" || sp.classList.contains("d-none");
					},
					{ timeout: 10000 },
					regionIds[i],
				);
			} catch (e) {
				console.log(`  -> Loading ${regionIds[i]} có thể chưa kịp`);
			}
		}
		await sleep(2000);

		for (let i = 0; i < regionIds.length; i++) {
			const tourCards = await page.$$(`#carousel${regionIds[i]} .top-tour-card`);
			check(`Region ${regionNames[i]} có tour cards`, tourCards.length > 0, `Tìm thấy ${tourCards.length} cards`);
		}
		await shot("05-region-tours");

		// ========================================================================
		// TC06: Footer
		// ========================================================================
		console.log("\n--- TC06: Kiểm tra Footer ---");
		const footer = await page.$("footer");
		check("Footer tồn tại", !!footer);

		if (footer) {
			const columns = await footer.$$("div[class*='col']");
			check("Footer có các cột", columns.length >= 3, `Tìm thấy ${columns.length} cột`);

			const copyright = await footer.$('[class*="copyright"], p:contains("2024")');
			const hasCopyright = copyright !== null;
			const bodyText = await page.evaluate((el) => el.textContent, footer);
			check("Footer có copyright", hasCopyright || bodyText.includes("2024"));
			check("Footer có nội dung 'VietTravel'", bodyText.includes("VietTravel"));
		}
		await shot("06-footer");

		// ========================================================================
		// TỔNG KẾT
		// ========================================================================
		console.log("\n============================================");
		console.log(`✅ TC HOÀN TẤT — ${passCount} PASS / ${failCount} FAIL / ${step} ảnh`);
		console.log(`📁 Thư mục: ${DIR}`);
		console.log("============================================\n");
		console.log("Trình duyệt sẽ đóng sau 10 giây...");
		await sleep(10000);
	} catch (err) {
		console.error(`\n❌ LỖI NGHIÊM TRỌNG: ${err.message}`);
		try {
			await page.screenshot({
				path: path.join(DIR, "error-fatal.png"),
				fullPage: true,
			});
			console.log("  >> Đã chụp ảnh lỗi");
		} catch (e) {}
		console.log(`\n📊 KẾT QUẢ CUỐI: ${passCount} PASS / ${failCount + 1} FAIL (có lỗi)`);
	} finally {
		try {
			await browser.close();
		} catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
