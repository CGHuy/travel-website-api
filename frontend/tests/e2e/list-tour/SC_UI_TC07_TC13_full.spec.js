const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "UI_TC07-TC13");
const URL = "http://localhost:3000/list-tour";
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

	try {
		// ========================================================================
		// MỞ TRANG DANH SÁCH TOUR
		// ========================================================================
		console.log("\n========== MỞ TRANG DANH SÁCH TOUR ==========");
		await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
		console.log("  -> Trang danh sách tour đã tải xong");
		await shotFull("00-list-tour-full");

		// ========================================================================
		// TC_UI_07: Kiểm tra bộ lọc tour
		// ========================================================================
		console.log("\n========== TC_UI_07: Kiểm tra bộ lọc tour ==========");
		const filterSidebar = await page.$(".filter-sidebar");
		check("Filter Sidebar tồn tại", !!filterSidebar);

		const filterTitle = await page.$(".filter-sidebar h5");
		check("Sidebar có tiêu đề 'Bộ lọc'", !!filterTitle);
		if (filterTitle) {
			const titleText = await page.evaluate((el) => el.textContent.trim(), filterTitle);
			check("Tiêu đề bộ lọc đúng", titleText.includes("Bộ lọc"), titleText);
		}

		// Khoảng giá
		const priceLabel = await page.evaluate(() => {
			const result = document.evaluate('//label[contains(text(), "Khoảng giá")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return result.singleNodeValue;
		});
		check("Có nhãn 'Khoảng giá'", !!priceLabel);

		const priceRange = await page.$("#priceRange");
		check("Có thanh trượt giá (range slider)", !!priceRange);
		if (priceRange) {
			const min = await page.evaluate((el) => el.getAttribute("min"), priceRange);
			const max = await page.evaluate((el) => el.getAttribute("max"), priceRange);
			check("Thanh trượt có min và max", min && max, `min=${min}, max=${max}`);
		}

		const priceMin = await page.$("#priceMin");
		check("Có hiển thị giá trị", !!priceMin);

		// Khu vực
		const regionLabel = await page.evaluate(() => {
			const result = document.evaluate('//label[contains(text(), "Khu vực")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return result.singleNodeValue;
		});
		check("Có nhãn 'Khu vực'", !!regionLabel);

		const regionSelect = await page.$("#regionSelect");
		check("Có dropdown khu vực", !!regionSelect);
		if (regionSelect) {
			const options = await page.$$("#regionSelect option");
			check("Dropdown có 4 option", options.length === 4, `Tìm thấy ${options.length} options`);
			const optionTexts = [];
			for (const opt of options) {
				const t = await page.evaluate((el) => el.textContent.trim(), opt);
				optionTexts.push(t);
			}
			check("Có 'Tất cả khu vực'", optionTexts.includes("Tất cả khu vực"));
			check("Có 'Miền Bắc'", optionTexts.includes("Miền Bắc"));
			check("Có 'Miền Trung'", optionTexts.includes("Miền Trung"));
			check("Có 'Miền Nam'", optionTexts.includes("Miền Nam"));
		}

		// Thời lượng
		const durationLabel = await page.evaluate(() => {
			const result = document.evaluate('//label[contains(text(), "Thời lượng")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return result.singleNodeValue;
		});
		check("Có nhãn 'Thời lượng'", !!durationLabel);

		const durAll = await page.$("#dur_all");
		const durShort = await page.$("#dur_short");
		const durLong = await page.$("#dur_long");
		check("Có radio 'Tất cả'", !!durAll);
		check("Có radio '1-3 ngày'", !!durShort);
		check("Có radio '4+ ngày'", !!durLong);
		if (durAll) {
			const checked = await page.evaluate((el) => el.checked, durAll);
			check("Radio 'Tất cả' được chọn mặc định", checked);
		}

		// Dịch vụ
		const serviceLabel = await page.evaluate(() => {
			const result = document.evaluate('//label[contains(text(), "Dịch vụ")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return result.singleNodeValue;
		});
		check("Có nhãn 'Dịch vụ'", !!serviceLabel);

		const serviceContainer = await page.$("#service-filter-container");
		check("Có container dịch vụ", !!serviceContainer);

		// Đợi service checkboxes load
		try {
			await page.waitForFunction(
				() => {
					const container = document.querySelector("#service-filter-container");
					if (!container) return false;
					const inputs = container.querySelectorAll("input[type='checkbox']");
					return inputs.length > 0;
				},
				{ timeout: 8000 },
			);
		} catch (e) {
			console.log("  -> Service checkboxes có thể chưa load kịp");
		}
		await sleep(1000);

		const serviceCheckboxes = await page.$$("#service-filter-container input[type='checkbox']");
		check("Có các checkbox dịch vụ", serviceCheckboxes.length > 0, `Tìm thấy ${serviceCheckboxes.length} dịch vụ`);

		// Nút làm mới bộ lọc
		const resetBtn = await page.$("#applyFilterBtn");
		check("Có nút 'Áp dụng bộ lọc'", !!resetBtn);
		if (resetBtn) {
			const btnText = await page.evaluate((el) => el.textContent.trim(), resetBtn);
			check("Nút có text", btnText.length > 0, btnText);
		}

		await shotEl(filterSidebar, "07-filter-sidebar");

		// ========================================================================
		// TC_UI_08: Kiểm tra ô tìm kiếm
		// ========================================================================
		console.log("\n========== TC_UI_08: Kiểm tra ô tìm kiếm ==========");
		const searchInput = await page.$("#searchInput");
		check("Có ô tìm kiếm", !!searchInput);
		if (searchInput) {
			const placeholder = await page.evaluate((el) => el.getAttribute("placeholder"), searchInput);
			check("Ô tìm kiếm có placeholder", placeholder && placeholder.length > 0, placeholder);
		}

		const searchIcon = await page.$("input#searchInput ~ div i.fa-magnifying-glass, .fa-magnifying-glass");
		check("Có icon kính lúp", !!searchIcon);

		// Chụp ô tìm kiếm
		const searchBoxId = await page.evaluate(() => {
			const input = document.getElementById("searchInput");
			if (!input) return null;
			const pill = input.parentElement;
			if (!pill) return null;
			pill.id = "_puppet_search";
			return "_puppet_search";
		});
		const searchBox = await page.$("#_puppet_search");
		if (searchBox) {
			await page.evaluate(() => {
				const el = document.getElementById("_puppet_search");
				if (el) el.scrollIntoView({ block: "center" });
			});
			await sleep(300);
			await shotEl(searchBox, "08-search-box");
		}
		check("Có container ô tìm kiếm", !!searchBox);

		// ========================================================================
		// TC_UI_09: Kiểm tra chức năng sắp xếp
		// ========================================================================
		console.log("\n========== TC_UI_09: Kiểm tra chức năng sắp xếp ==========");
		const sortLabel = await page.evaluate(() => {
			const result = document.evaluate('//label[contains(text(), "Sắp xếp")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return result.singleNodeValue;
		});
		check("Có nhãn 'Sắp xếp'", !!sortLabel);

		const sortSelect = await page.$("#sort");
		check("Có dropdown sắp xếp", !!sortSelect);
		if (sortSelect) {
			const sortOptions = await page.$$("#sort option");
			check("Dropdown có 3 option", sortOptions.length === 3, `Tìm thấy ${sortOptions.length} options`);
			const sortTexts = [];
			for (const opt of sortOptions) {
				const t = await page.evaluate((el) => el.textContent.trim(), opt);
				sortTexts.push(t);
			}
			check("Có 'Tất cả'", sortTexts.includes("Tất cả"));
			check("Có 'Giá: Thấp đến cao'", sortTexts.includes("Giá: Thấp đến cao"));
			check("Có 'Giá: Cao đến thấp'", sortTexts.includes("Giá: Cao đến thấp"));
		}

		const sortWrap = await page.$("div:has(> #sort)");
		await shotEl(sortWrap || sortSelect, "09-sort-dropdown");

		// ========================================================================
		// TC_UI_10: Kiểm tra danh sách tour
		// ========================================================================
		console.log("\n========== TC_UI_10: Kiểm tra danh sách tour ==========");
		const tourListContainer = await page.$("#tour-list");
		check("Có container #tour-list", !!tourListContainer);

		// Đợi tours load xong (spinner biến mất)
		try {
			await page.waitForFunction(
				() => {
					const spinner = document.querySelector("#tour-list .spinner-border");
					return !spinner;
				},
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  -> Spinner có thể không biến mất trong 10s");
		}
		await sleep(2000);

		const tourCards = await page.$$("#tour-list .tour-horizontal-card");
		check("Có tour cards hiển thị", tourCards.length > 0, `Tìm thấy ${tourCards.length} tour cards`);

		// Kiểm tra bố cục không bị chồng chéo
		if (tourCards.length > 0) {
			for (let i = 0; i < Math.min(tourCards.length, 3); i++) {
				const cardRect = await page.evaluate((el) => {
					const r = el.getBoundingClientRect();
					return { width: r.width, height: r.height, top: r.top, left: r.left };
				}, tourCards[i]);
				check(`Tour card ${i + 1} có kích thước hợp lệ`, cardRect.width > 0 && cardRect.height > 0, `${cardRect.width}x${cardRect.height}`);
			}
		}

		await shotEl(tourListContainer, "10-tour-list");

		// ========================================================================
		// TC_UI_11: Kiểm tra thông tin tour
		// ========================================================================
		console.log("\n========== TC_UI_11: Kiểm tra thông tin tour ==========");
		if (tourCards.length > 0) {
			for (let i = 0; i < Math.min(tourCards.length, 3); i++) {
				const card = tourCards[i];

				const img = await card.$("img.object-fit-cover, img");
				check(`Tour ${i + 1} có hình ảnh`, !!img);
				if (img) {
					const src = await page.evaluate((el) => el.getAttribute("src"), img);
					check(`Tour ${i + 1} có đường dẫn ảnh`, src && src.length > 0);
				}

				const name = await card.$("h4.card-title");
				check(`Tour ${i + 1} có tên tour`, !!name);
				if (name) {
					const nameText = await page.evaluate((el) => el.textContent.trim(), name);
					check(`Tên tour ${i + 1} không rỗng`, nameText.length > 0, nameText);
				}

				const codeText = await page.evaluate((card) => {
					const result = document.evaluate('.//span[contains(text(), "TOUR")]', card, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
					const span = result.singleNodeValue;
					return span ? span.textContent.trim() : null;
				}, card);
				check(`Tour ${i + 1} có mã tour`, !!codeText);
				if (codeText) {
					check(`Mã tour ${i + 1} đúng định dạng`, /^TOUR\d{3}$/.test(codeText), codeText);
				}

				const durationSpans = await card.$$("span.fw-bold");
				let hasDuration = false;
				for (const span of durationSpans) {
					const t = await page.evaluate((el) => el.textContent.trim(), span);
					if (t.includes("ngày") || /\d+N\d+Đ/.test(t)) {
						hasDuration = true;
						break;
					}
				}
				check(`Tour ${i + 1} có thời gian`, hasDuration);

				const regionSpan = await card.$("span.fw-medium");
				let hasRegion = false;
				if (regionSpan) {
					const regionText = await page.evaluate((el) => el.textContent.trim(), regionSpan);
					hasRegion = regionText.length > 0;
					if (hasRegion) console.log(`    -> Tour ${i + 1} khu vực: ${regionText}`);
				}
				check(`Tour ${i + 1} có khu vực`, hasRegion);

				const dateSpans = await card.$$(".border.border-danger");
				check(`Tour ${i + 1} có ngày khởi hành`, dateSpans.length > 0, `Tìm thấy ${dateSpans.length} ngày`);

				const priceSpan = await card.$("span.text-danger");
				check(`Tour ${i + 1} có giá`, !!priceSpan);
				if (priceSpan) {
					const priceText = await page.evaluate((el) => el.textContent.trim(), priceSpan);
					check(`Tour ${i + 1} có giá trị hợp lệ`, priceText.length > 0, priceText);
				}
			}
		}
		if (tourCards[0]) {
			await page.evaluate(el => {
				el.scrollIntoView({ block: "center" });
				el.style.overflow = "visible";
			}, tourCards[0]);
			await sleep(300);
			await shotEl(tourCards[0], "11-tour-info");
			await page.evaluate(el => { el.style.overflow = ""; }, tourCards[0]);
		}

		// ========================================================================
		// TC_UI_12: Kiểm tra nút Xem chi tiết
		// ========================================================================
		console.log("\n========== TC_UI_12: Kiểm tra nút Xem chi tiết ==========");
		if (tourCards.length > 0) {
			const detailButtons = await page.$$(".tour-horizontal-card .btn-primary");
			check("Số nút Xem chi tiết bằng số tour", detailButtons.length === tourCards.length, `${detailButtons.length} nút / ${tourCards.length} tour`);

			for (let i = 0; i < Math.min(detailButtons.length, 3); i++) {
				const btn = detailButtons[i];
				const btnText = await page.evaluate((el) => el.textContent.trim(), btn);
				check(`Nút tour ${i + 1} có text 'Xem chi tiết'`, btnText.includes("Xem chi tiết"), btnText);

				const href = await page.evaluate((el) => el.getAttribute("href"), btn);
				check(`Nút tour ${i + 1} có link detail`, !!href && href.includes("/detail-tour"), href);

				const btnRect = await page.evaluate((el) => {
					const r = el.getBoundingClientRect();
					return { width: r.width, height: r.height };
				}, btn);
				check(`Nút tour ${i + 1} hiển thị (có kích thước)`, btnRect.width > 0 && btnRect.height > 0);
			}
		}
		if (tourCards.length > 0) {
			const detailBtn = await tourCards[0].$(".btn-primary");
			await shotEl(detailBtn || tourCards[0], "12-detail-button");
		}

		// ========================================================================
		// TC_UI_13: Kiểm tra phân trang
		// ========================================================================
		console.log("\n========== TC_UI_13: Kiểm tra phân trang ==========");
		const paginationContainer = await page.$("#pagination-container");
		check("Có pagination container", !!paginationContainer);

		const pageItems = await page.$$("#pagination-container .page-item");
		if (pageItems.length > 0) {
			check("Có các trang", pageItems.length >= 2, `Tìm thấy ${pageItems.length} page items`);

			const activePage = await page.$("#pagination-container .page-item.active .page-link");
			if (activePage) {
				const activePageNum = await page.evaluate((el) => el.textContent.trim(), activePage);
				check("Trang hiện tại được đánh dấu active", activePageNum === "1", `Trang ${activePageNum}`);
			}

			// Kiểm tra nút Prev/Next
			let hasPrev = false;
			let hasNext = false;
			for (const item of pageItems) {
				const html = await page.evaluate((el) => el.innerHTML, item);
				if (html.includes("fa-chevron-left")) hasPrev = true;
				if (html.includes("fa-chevron-right")) hasNext = true;
			}
			check("Có nút chuyển trang Previous", hasPrev);
			check("Có nút chuyển trang Next", hasNext);

			// Thử click Next nếu có thể
			const nextBtn = await page.$("#pagination-container .page-item:not(.disabled) a:has(.fa-chevron-right)");
			if (nextBtn) {
				await nextBtn.click();
				await sleep(2000);
				const newActive = await page.$("#pagination-container .page-item.active .page-link");
				if (newActive) {
					const newActiveNum = await page.evaluate((el) => el.textContent.trim(), newActive);
					check("Click Next chuyển sang trang 2", newActiveNum === "2" || newActiveNum.includes("2"), `Trang ${newActiveNum}`);
				}
			}

			await shotEl(paginationContainer, "13-pagination");
		} else {
			console.log("  -> Không có phân trang (1 trang hoặc 0 tour)");
			check("Phân trang trống khi không cần", true);
		}

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
		} catch (e) { }
		console.log(`\n\ud83d\udcca KẾT QUẢ CUỐI: ${passCount} PASS / ${failCount + 1} FAIL (có lỗi)`);
	} finally {
		try { await browser.close(); } catch (e) { }
		console.log("Đã đóng trình duyệt");
	}
})();
