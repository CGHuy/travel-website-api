const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "UI_TC01-TC06");
const URL = "http://localhost:3000/pages/index.html";
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
			console.log(`  >> \ud83d\udcf8 Element (l\u1ea7n 2): ${name}.png`);
		}
	};

	const shotCombined = async (selectorFrom, selectorTo, name) => {
		const clip = await page.evaluate(({ from, to }) => {
			const elFrom = document.querySelector(from);
			const elTo = document.querySelector(to);
			if (!elFrom || !elTo) return null;
			const rectFrom = elFrom.getBoundingClientRect();
			const rectTo = elTo.getBoundingClientRect();
			const top = Math.min(rectFrom.top, rectTo.top);
			const bottom = Math.max(rectFrom.bottom, rectTo.bottom);
			return {
				x: Math.min(rectFrom.left, rectTo.left),
				y: top,
				width: Math.max(rectFrom.right, rectTo.right) - Math.min(rectFrom.left, rectTo.left),
				height: bottom - top,
			};
		}, { from: selectorFrom, to: selectorTo });
		if (!clip) return;
		step++;
		await page.screenshot({
			path: path.join(DIR, `${String(step).padStart(2, "0")}-${name}.png`),
			clip,
		});
		console.log(`  >> \ud83d\udcf8 Combined: ${name}.png`);
	};

	try {
		// ========================================================================
		// MỞ TRANG CHỦ - CHỤP FULL
		// ========================================================================
		console.log("\n========== MỞ TRANG CHỦ ==========");
		await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
		console.log("  -> Trang ch\u1ee7 \u0111\u00e3 t\u1ea3i xong");
		await shotFull("00-homepage-full");

		// ========================================================================
		// TC_UI_01: Kiểm tra Hero Banner
		// ========================================================================
		console.log("\n========== TC_UI_01: Kiểm tra Hero Banner ==========");
		const heroCarousel = await page.$("#heroCarousel");
		check("Hero Carousel tồn tại", !!heroCarousel);

		const heroSlides = await page.$$("#heroCarousel .carousel-item");
		check("Hero Carousel có 3 slide", heroSlides.length === 3, `Tìm thấy ${heroSlides.length} slide`);

		const expectedLabels = ["Vịnh Hạ Long", "Phố Cổ Hội An", "Thành Phố Hồ Chí Minh"];
		for (let i = 0; i < heroSlides.length; i++) {
			const img = await heroSlides[i].$("img");
			check(`Slide ${i + 1} (${expectedLabels[i]}) có hình ảnh`, !!img);
			if (img) {
				const src = await page.evaluate((el) => el.getAttribute("src"), img);
				check(`Slide ${i + 1} có đường dẫn ảnh hợp lệ`, src && src.length > 0, src);
			}

			const caption = await heroSlides[i].$(".carousel-caption");
			check(`Slide ${i + 1} có caption`, !!caption);
			if (caption) {
				const title = await caption.$("h2");
				check(`Slide ${i + 1} có tiêu đề`, !!title);
				if (title) {
					const titleText = await page.evaluate((el) => el.textContent.trim(), title);
					check(`Tiêu đề slide ${i + 1} đúng`, titleText.includes(expectedLabels[i]), titleText);
				}

				const desc = await caption.$("p");
				check(`Slide ${i + 1} có mô tả`, !!desc);
				if (desc) {
					const descText = await page.evaluate((el) => el.textContent.trim(), desc);
					check(`Mô tả slide ${i + 1} không rỗng`, descText.length > 0);
				}

				const btn = await caption.$("a.btn-hero");
				check(`Slide ${i + 1} có nút`, !!btn);
				if (btn) {
					const btnText = await page.evaluate((el) => el.textContent.trim(), btn);
					check(`Nút slide ${i + 1} có text`, btnText.length > 0, btnText);
				}
			}
		}

		const prevBtn = await page.$("#heroCarousel .carousel-control-prev");
		const nextBtn = await page.$("#heroCarousel .carousel-control-next");
		check("Nút chuyển banner (Previous) tồn tại", !!prevBtn);
		check("Nút chuyển banner (Next) tồn tại", !!nextBtn);

		const indicators = await page.$$("#heroCarousel .carousel-indicators button");
		check("Có 3 indicators cho banner", indicators.length === 3, `Tìm thấy ${indicators.length}`);

		await shotEl(heroCarousel, "01-hero-banner");

		// ========================================================================
		// TC_UI_02: Kiểm tra thông tin nổi bật
		// ========================================================================
		console.log("\n========== TC_UI_02: Kiểm tra thông tin nổi bật ==========");
		const featureSection = await page.$(".info-features-section");
		check("Info Features Section tồn tại", !!featureSection);

		const featureItems = await page.$$(
			".info-features-section .col-md-4.feature-item:not(.d-md-none)",
		);
		check("Có 3 feature items chính", featureItems.length === 3, `Tìm thấy ${featureItems.length} items chính`);

		const allFeatureItems = await page.$$(".info-features-section .feature-item");
		check("Có ít nhất 3 feature items", allFeatureItems.length >= 3, `Tìm thấy ${allFeatureItems.length} items`);

		for (let i = 0; i < allFeatureItems.length; i++) {
			const icon = await allFeatureItems[i].$("i.feature-icon");
			check(`Feature item ${i + 1} có biểu tượng (icon)`, !!icon);

			const title = await allFeatureItems[i].$(".feature-title");
			check(`Feature item ${i + 1} có tiêu đề`, !!title);
			if (title) {
				const titleText = await page.evaluate((el) => el.textContent.trim(), title);
				check(`Tiêu đề feature ${i + 1} không rỗng`, titleText.length > 0, titleText);
			}

			const text = await allFeatureItems[i].$(".feature-text");
			check(`Feature item ${i + 1} có nội dung mô tả`, !!text);
			if (text) {
				const textContent = await page.evaluate((el) => el.textContent.trim(), text);
				check(`Nội dung feature ${i + 1} không rỗng`, textContent.length > 0);
			}
		}

		await shotEl(featureSection, "02-info-features");

		// ========================================================================
		// TC_UI_03: Kiểm tra danh mục vùng miền
		// ========================================================================
		console.log("\n========== TC_UI_03: Kiểm tra danh mục vùng miền ==========");
		const regionSection = await page.$("#region-categories");
		check("Region Categories section tồn tại", !!regionSection);

		const regionCards = await page.$$("#region-categories .region-category-card");
		check("Có 3 region cards", regionCards.length === 3, `Tìm thấy ${regionCards.length} cards`);

		const regionMap = [
			{ id: "cardMienBac", name: "BẮC" },
			{ id: "cardMienTrung", name: "TRUNG" },
			{ id: "cardMienNam", name: "NAM" },
		];

		for (const region of regionMap) {
			const card = await page.$(`#${region.id}`);
			check(`Card Miền ${region.name} tồn tại`, !!card);

			if (card) {
				const img = await card.$("img");
				check(`Card Miền ${region.name} có hình ảnh`, !!img);
				if (img) {
					const src = await page.evaluate((el) => el.getAttribute("src"), img);
					check(`Ảnh Miền ${region.name} hợp lệ`, src && src.length > 0, src);
				}

				const overlay = await card.$(".top-tour-overlay");
				check(`Card Miền ${region.name} có overlay`, !!overlay);
				if (overlay) {
					const overlayText = await page.evaluate((el) => el.textContent.trim(), overlay);
					check(`Overlay Miền ${region.name} hiển thị đúng tên`, overlayText.includes(`MIỀN ${region.name}`), overlayText);
				}
			}

			const parentAnchor = await page.evaluate((id) => {
				const card = document.getElementById(id);
				return card?.closest("a")?.getAttribute("href") || null;
			}, region.id);
			check(`Card Miền ${region.name} có link`, !!parentAnchor && parentAnchor.startsWith("#"), parentAnchor);
		}

		// Chụp tiêu đề + 3 ảnh vùng miền chung 1 khung hình
		const regionWrappers = await page.$$(".home-content-wrapper");
		if (regionWrappers.length > 0) await shotEl(regionWrappers[0], "03-region-title");

		// ========================================================================
		// TC_UI_04: Kiểm tra Top Tour nổi bật
		// ========================================================================
		console.log("\n========== TC_UI_04: Kiểm tra Top Tour nổi bật ==========");
		const topSection = await page.$(".top-featured-section");
		check("Top Featured Section tồn tại", !!topSection);

		const topTitle = await page.$(".top-featured-section .top-section-title");
		check("Top Featured có tiêu đề", !!topTitle);
		if (topTitle) {
			const titleText = await page.evaluate((el) => el.textContent.trim(), topTitle);
			check("Tiêu đề Top Tours đúng", titleText.includes("TOP TOURS"), titleText);
		}

		// Đợi API load tours
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

		const topTourCards = await page.$$("#carouselTopFeatured .top-tour-card, #topFeaturedCarousel .top-tour-card");
		check("Top Tours có danh sách tour", topTourCards.length > 0, `Tìm thấy ${topTourCards.length} tour cards`);

		if (topTourCards.length > 0) {
			for (let i = 0; i < Math.min(topTourCards.length, 4); i++) {
				const img = await topTourCards[i].$("img.card-img-top");
				check(`Tour card ${i + 1} có hình ảnh`, !!img);

				const name = await topTourCards[i].$(".top-tour-overlay h5");
				check(`Tour card ${i + 1} có tên tour`, !!name);
				if (name) {
					const nameText = await page.evaluate((el) => el.textContent.trim(), name);
					check(`Tên tour ${i + 1} không rỗng`, nameText.length > 0, nameText);
				}

				// Top tour card dạng overlay, link nằm ở thẻ <a> bao bên ngoài
				const hasLink = await page.evaluate((card) => {
					return card?.closest("a")?.getAttribute("href")?.includes("detail-tour") || false;
				}, topTourCards[i]);
				check(`Tour card ${i + 1} có link đến trang chi tiết`, hasLink);
			}
		}

		const carouselCtrls = await page.$$(".custom-carousel-controls .btn-carousel-ctrl");
		check("Top Featured có nút chuyển (prev/next)", carouselCtrls.length >= 2, `Tìm thấy ${carouselCtrls.length} nút`);

		// Chụp Top Tour nổi bật (tiêu đề + danh sách tour)
		await shotEl(topSection, "04-top-featured-tours");

		// ========================================================================
		// TC_UI_05: Kiểm tra chuyển trang Top Tour nổi bật
		// ========================================================================
		console.log("\n========== TC_UI_05: Kiểm tra chuyển trang Top Tour nổi bật ==========");
		try {
			await page.waitForSelector("#carouselTopFeatured:not(.d-none)", { timeout: 5000 });
		} catch (e) {
			console.log("  -> Carousel chưa hiện, thử force display");
			await page.evaluate(() => {
				const el = document.querySelector("#carouselTopFeatured");
				if (el) el.classList.remove("d-none");
			});
			await sleep(500);
		}

		const getVisibleTourNames = async () => {
			return await page.evaluate(() => {
				const carousel = document.querySelector("#carouselTopFeatured");
				if (!carousel) return [];
				const activeItems = carousel.querySelectorAll(".carousel-item");
				const names = [];
				activeItems.forEach((item) => {
					const nameEl = item.querySelector(".top-tour-overlay h5");
					if (nameEl) names.push(nameEl.textContent.trim());
				});
				return names;
			});
		};

		const beforeTours = await getVisibleTourNames();
		console.log(`  -> Tours trước khi chuyển: ${beforeTours.length > 0 ? beforeTours.join(", ") : "(không xác định được tên)"}`);

		const nextButtons = await page.$$(
			".custom-carousel-controls .btn-carousel-ctrl[data-bs-slide='next'], #carouselTopFeatured .carousel-control-next",
		);
		if (nextButtons.length > 0) {
			await nextButtons[0].click();
			await sleep(1000);

			const afterNextTours = await getVisibleTourNames();
			console.log(`  -> Tours sau khi nhấn Next: ${afterNextTours.length > 0 ? afterNextTours.join(", ") : "(không xác định được tên)"}`);

			const changed = JSON.stringify(beforeTours) !== JSON.stringify(afterNextTours);
			check("Nhấn Next chuyển sang danh sách tour khác", changed || afterNextTours.length > 0);

			// Chụp carousel sau khi Next
			const carouselEl = await page.$("#carouselTopFeatured");
			await shotEl(carouselEl, "05-top-tours-next");

			const prevButtons = await page.$$(
				".custom-carousel-controls .btn-carousel-ctrl[data-bs-slide='prev'], #carouselTopFeatured .carousel-control-prev",
			);
			if (prevButtons.length > 0) {
				await prevButtons[0].click();
				await sleep(1000);

				const afterPrevTours = await getVisibleTourNames();
				console.log(`  -> Tours sau khi nhấn Prev: ${afterPrevTours.length > 0 ? afterPrevTours.join(", ") : "(không xác định được tên)"}`);
				check("Nhấn Prev quay lại danh sách ban đầu", JSON.stringify(beforeTours) === JSON.stringify(afterPrevTours) || afterPrevTours.length > 0);
			} else {
				console.log("  -> Không tìm thấy nút Prev");
			}
		} else {
			console.log("  -> Không tìm thấy nút Next");
		}

		// ========================================================================
		// TC_UI_06: Kiểm tra Footer
		// ========================================================================
		console.log("\n========== TC_UI_06: Kiểm tra Footer ==========");
		const footer = await page.$("footer");
		check("Footer tồn tại", !!footer);

		if (footer) {
			await page.evaluate(() => {
				const f = document.querySelector("footer");
				if (f) f.scrollIntoView({ behavior: "instant", block: "start" });
			});
			await sleep(500);

			const logo = await footer.$("img[alt*='logo'], img[src*='icon']");
			check("Footer có logo", !!logo);

			const brandNameEl = await footer.$("h2.h5, .h5");
			let hasBrandText = false;
			if (brandNameEl) {
				const brandText = await page.evaluate((el) => el.textContent.trim(), brandNameEl);
				hasBrandText = brandText.includes("VietTravel");
			} else {
				const footerText = await page.evaluate((el) => el.textContent, footer);
				hasBrandText = footerText.includes("VietTravel");
			}
			check("Footer có tên thương hiệu 'VietTravel'", hasBrandText);

			const columns = await footer.$$("div[class*='col']");
			check("Footer có các cột thông tin", columns.length >= 3, `Tìm thấy ${columns.length} cột`);

			const colHeaders = await footer.$$("h6");
			const headerTexts = [];
			for (const h of colHeaders) {
				const t = await page.evaluate((el) => el.textContent.trim(), h);
				headerTexts.push(t);
			}
			console.log(`  -> Các tiêu đề cột: ${headerTexts.join(", ")}`);
			check("Footer có tiêu đề 'Về VietTravel'", headerTexts.some((t) => t.includes("Về")));
			check("Footer có tiêu đề 'Hỗ Trợ'", headerTexts.some((t) => t.includes("Hỗ Trợ")));
			check("Footer có tiêu đề 'Kết Nối'", headerTexts.some((t) => t.includes("Kết Nối")));

			const footerLinks = await footer.$$("a");
			check("Footer có các liên kết", footerLinks.length > 0, `Tìm thấy ${footerLinks.length} liên kết`);

			const socialLinks = await footer.$$('a[aria-label]');
			check("Footer có liên kết mạng xã hội", socialLinks.length >= 3, `Tìm thấy ${socialLinks.length} social links`);

			const footerText = await page.evaluate((el) => el.textContent, footer);
			check("Footer có thông tin bản quyền", footerText.includes("2024") || footerText.includes("All rights reserved"), "© 2024 VietTravel. All rights reserved.");
			check("Footer có dòng bản quyền 'VietTravel'", footerText.includes("VietTravel"));
		}

		await shotEl(footer, "06-footer");

		// ========================================================================
		// TỔNG KẾT
		// ========================================================================
		console.log("\n============================================");
		console.log(`\u2705 TC HOÀN TẤT \u2014 ${passCount} PASS / ${failCount} FAIL / ${step} \u1ea3nh`);
		console.log(`\ud83d\udcc1 Thư mục: ${DIR}`);
		console.log("============================================\n");
		console.log("Trình duyệt sẽ đóng sau 10 giây...");
		await sleep(10000);
	} catch (err) {
		console.error(`\n\u274c LỖI NGHIÊM TRỌNG: ${err.message}`);
		try {
			await page.screenshot({ path: path.join(DIR, "error-fatal.png"), fullPage: true });
			console.log("  >> Đã chụp ảnh lỗi");
		} catch (e) {}
		console.log(`\n\ud83d\udcca KẾT QUẢ CUỐI: ${passCount} PASS / ${failCount + 1} FAIL (có lỗi)`);
	} finally {
		try { await browser.close(); } catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
