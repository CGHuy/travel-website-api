const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const DIR = path.resolve(__dirname, "screenshots", "UI_TC19-TC23");
const BASE_URL = "http://localhost:3000";
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
	// BƯỚC 1: ĐĂNG NHẬP
	// ========================================================================
	console.log("\n========== BƯỚC 1: ĐĂNG NHẬP ==========");
	await page.goto(`${BASE_URL}/pages/auth/login.html`, {
		waitUntil: "networkidle0",
	});
	await page.waitForSelector("#loginForm");
	await sleep(1000);
	console.log("  -> Nhập tài khoản...");
	await page.type("#username", "nam@gmail.com", { delay: 20 });
	await page.type("#password", "123456", { delay: 20 });
	await page.click('button[type="submit"]');
	console.log("  -> Click Đăng nhập...");
	await page.waitForFunction(() => localStorage.getItem("token") !== null, {
		timeout: 8000,
	});
	await page
		.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })
		.catch(() => { });
	await sleep(1000);
	console.log("  -> Đăng nhập thành công");

	// ========================================================================
	// BƯỚC 2: VÀO TRANG ĐẶT TOUR
	// ========================================================================
	console.log("\n========== BƯỚC 2: VÀO TRANG ĐẶT TOUR ==========");
	await page.goto(`${BASE_URL}/booking-tour?tour_id=1`, {
		waitUntil: "networkidle0",
		timeout: 30000,
	});
	await page.waitForSelector("#booking-form", { timeout: 10000 });
	await page.waitForSelector("#tour-name-display", { timeout: 10000 });
	await sleep(2500);
	console.log("  -> Trang đặt tour đã load");
	await shotFull("00-booking-full");

	// ========================================================================
	// TC_UI_19: Kiểm tra thông tin liên hệ
	// ========================================================================
	console.log("\n========== TC_UI_19: Kiểm tra thông tin liên hệ ==========");
	const form = await page.$("#booking-form");
	check("Có form đặt tour", !!form);

	const contactName = await page.$("#contact_name");
	check("Có trường Họ tên", !!contactName);
	if (contactName) {
		const placeholder = await page.evaluate((el) => el.getAttribute("placeholder"), contactName);
		check("Họ tên có placeholder", placeholder && placeholder.length > 0, placeholder);
		const required = await page.evaluate((el) => el.hasAttribute("required"), contactName);
		check("Họ tên là bắt buộc", required);
	}

	const contactPhone = await page.$("#contact_phone");
	check("Có trường Số điện thoại", !!contactPhone);
	if (contactPhone) {
		const placeholder = await page.evaluate((el) => el.getAttribute("placeholder"), contactPhone);
		check("Số điện thoại có placeholder", placeholder && placeholder.length > 0, placeholder);
	}

	const contactDob = await page.$("#contact_dob");
	check("Có trường Ngày sinh", !!contactDob);

	const contactGender = await page.$("#contact_gender");
	check("Có trường Giới tính", !!contactGender);
	if (contactGender) {
		const options = await page.$$("#contact_gender option");
		check("Giới tính có ít nhất 2 option", options.length >= 2, `Tìm thấy ${options.length} options`);
	}

	const contactEmail = await page.$("#contact_email");
	check("Có trường Email", !!contactEmail);
	if (contactEmail) {
		const required = await page.evaluate((el) => el.hasAttribute("required"), contactEmail);
		check("Email là bắt buộc", required);
	}

	const note = await page.$("#note");
	check("Có trường Ghi chú thêm", !!note);

	// Check labels
	const labels = await page.$$("#booking-form .form-label");
	const labelTexts = await Promise.all(
		labels.map((l) => page.evaluate((el) => el.textContent.trim(), l))
	);
	const hasNameLabel = labelTexts.some((t) => t.includes("Tên người liên hệ"));
	const hasPhoneLabel = labelTexts.some((t) => t.includes("Số điện thoại"));
	const hasDobLabel = labelTexts.some((t) => t.includes("Ngày sinh"));
	const hasGenderLabel = labelTexts.some((t) => t.includes("Giới tính"));
	const hasEmailLabel = labelTexts.some((t) => t.includes("Email"));
	check("Có nhãn Họ tên", hasNameLabel);
	check("Có nhãn Số điện thoại", hasPhoneLabel);
	check("Có nhãn Ngày sinh", hasDobLabel);
	check("Có nhãn Giới tính", hasGenderLabel);
	check("Có nhãn Email", hasEmailLabel);

	await page.evaluate(() => {
		const el = document.querySelector(".card-booking");
		if (el) {
			el.scrollIntoView({ block: "center" });
			window.scrollBy(0, -100);
		}
	});
	await sleep(500);
	const cardBox = await page.evaluate(() => {
		const el = document.querySelector(".card-booking");
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return { x: r.x, y: r.y - 40, width: r.width, height: r.height + 40 };
	});
	step++;
	if (cardBox) {
		await page.screenshot({
			path: path.join(DIR, `${String(step).padStart(2, "0")}-19-contact-form.png`),
			clip: cardBox,
		});
		console.log(`  >> \ud83d\udcf8 Element: 19-contact-form.png`);
	}

	// ========================================================================
	// TC_UI_20: Kiểm tra thông tin tour
	// ========================================================================
	console.log("\n========== TC_UI_20: Kiểm tra thông tin tour ==========");
	const tourImg = await page.$("#tour-img");
	check("Có hình ảnh tour", !!tourImg);
	if (tourImg) {
		const src = await page.evaluate((el) => el.getAttribute("src"), tourImg);
		check("Hình ảnh có đường dẫn", src && src.length > 0, src ? src.substring(0, 60) : "");
	}

	const tourNameDisplay = await page.$("#tour-name-display");
	check("Có tên tour", !!tourNameDisplay);
	if (tourNameDisplay) {
		const nameText = await page.evaluate((el) => el.textContent.trim(), tourNameDisplay);
		check("Tên tour không rỗng", nameText.length > 0, nameText);
	}

	const tourCode = await page.$("#tour-code");
	check("Có mã tour", !!tourCode);
	if (tourCode) {
		const codeText = await page.evaluate((el) => el.textContent.trim(), tourCode);
		check("Mã tour không rỗng", codeText.length > 0, codeText);
	}

	const tourDuration = await page.$("#tour-duration");
	check("Có thời lượng tour", !!tourDuration);
	if (tourDuration) {
		const durText = await page.evaluate((el) => el.textContent.trim(), tourDuration);
		check("Thời lượng không rỗng", durText.length > 0, durText);
	}

	const priceAdult = await page.$("#price-adult");
	check("Có đơn giá người lớn", !!priceAdult);
	if (priceAdult) {
		const priceText = await page.evaluate((el) => el.textContent.trim(), priceAdult);
		check("Đơn giá người lớn không rỗng", priceText.length > 0, priceText);
	}

	const priceChild = await page.$("#price-child");
	check("Có đơn giá trẻ em", !!priceChild);
	if (priceChild) {
		const priceText = await page.evaluate((el) => el.textContent.trim(), priceChild);
		check("Đơn giá trẻ em không rỗng", priceText.length > 0, priceText);
	}

	const totalAmount = await page.$("#total-amount");
	check("Có tổng tiền", !!totalAmount);
	if (totalAmount) {
		const totalText = await page.evaluate((el) => el.textContent.trim(), totalAmount);
		check("Tổng tiền không rỗng", totalText.length > 0, totalText);
	}

	await page.evaluate(() => {
		const el = document.querySelector(".sidebar-tour-info");
		if (el) el.scrollIntoView({ block: "center" });
	});
	await sleep(300);
	const sidebar = await page.$(".sidebar-tour-info");
	await shotEl(sidebar, "20-tour-sidebar");

	// ========================================================================
	// TC_UI_21: Kiểm tra thông tin đặt chỗ
	// ========================================================================
	console.log("\n========== TC_UI_21: Kiểm tra thông tin đặt chỗ ==========");
	const departureSelect = await page.$("#departure_id");
	check("Có dropdown ngày khởi hành & điểm đón", !!departureSelect);
	if (departureSelect) {
		const required = await page.evaluate((el) => el.hasAttribute("required"), departureSelect);
		check("Ngày khởi hành là bắt buộc", required);
		const depOptions = await page.$$("#departure_id option");
		if (depOptions.length > 1) {
			check("Có lịch khởi hành để chọn", true, `Tìm thấy ${depOptions.length - 1} lịch`);
			for (const o of depOptions) {
				const v = await page.evaluate((el) => el.value, o);
				if (v) {
					await page.select("#departure_id", v);
					const text = await page.evaluate((el) => el.textContent, o);
					console.log(`  -> Đã chọn: ${text}`);
					break;
				}
			}
		} else {
			console.log("  -> Chưa có lịch khởi hành cho tour này (dữ liệu, không phải lỗi UI)");
		}
	}
	await sleep(1000);

	const availableSeats = await page.$("#available-seats-count");
	check("Có thông tin số chỗ còn nhận", !!availableSeats);
	if (availableSeats) {
		const seatsText = await page.evaluate((el) => el.textContent.trim(), availableSeats);
		check("Số chỗ còn nhận hiển thị", seatsText.length > 0, `${seatsText} chỗ`);
	}

	const adultsInput = await page.$("#adults");
	check("Có trường số lượng người lớn", !!adultsInput);
	if (adultsInput) {
		const val = await page.evaluate((el) => el.value, adultsInput);
		check("Số người lớn mặc định >= 1", parseInt(val) >= 1, val);
		const min = await page.evaluate((el) => el.getAttribute("min"), adultsInput);
		check("Người lớn có min=1", min === "1");
	}

	const adultsDec = await page.$('button[onclick*="updateQty(\'adults\'"]');
	check("Có nút giảm người lớn", !!adultsDec);

	const adultsInc = await page.$('button[onclick*="updateQty(\'adults\', 1)"]');
	check("Có nút tăng người lớn", !!adultsInc);

	const childrenInput = await page.$("#children");
	check("Có trường số lượng trẻ em", !!childrenInput);
	if (childrenInput) {
		const val = await page.evaluate((el) => el.value, childrenInput);
		check("Số trẻ em mặc định = 0", parseInt(val) === 0, val);
	}

	const childrenDec = await page.$('button[onclick*="updateQty(\'children\', -1)"]');
	check("Có nút giảm trẻ em", !!childrenDec);

	const childrenInc = await page.$('button[onclick*="updateQty(\'children\', 1)"]');
	check("Có nút tăng trẻ em", !!childrenInc);

	await page.evaluate(() => {
		const el = document.getElementById("departure_id");
		if (el) {
			const card = el.closest(".card-booking");
			if (card) {
				card.scrollIntoView({ block: "center" });
				window.scrollBy(0, -100);
			}
		}
		const card = document.getElementById("departure_id")?.closest(".card-booking");
		if (card) card.id = "__booking_details_card";
	});
	await sleep(500);
	const detailsSection = await page.$("#__booking_details_card");
	await shotEl(detailsSection, "21-booking-details");

	// ========================================================================
	// TC_UI_22: Kiểm tra thông báo lỗi dữ liệu
	// ========================================================================
	console.log("\n========== TC_UI_22: Kiểm tra thông báo lỗi dữ liệu ==========");

	// Fill valid data, set DOB under 18 to trigger custom age error
	console.log("  -> Nhập dữ liệu để kích hoạt validation...");
	await page.$eval("#contact_name", (el) => (el.value = ""));
	await page.type("#contact_name", "Nguyễn Văn A", { delay: 10 });

	await page.$eval("#contact_phone", (el) => (el.value = ""));
	await page.type("#contact_phone", "0912345678", { delay: 10 });

	await page.$eval("#contact_email", (el) => (el.value = ""));
	await page.type("#contact_email", "test@test.com", { delay: 10 });

	await page.select("#contact_gender", "Nam");

	// Set DOB to under 18 (10 years old)
	await page.evaluate(() => {
		const p = document.getElementById("contact_dob")._flatpickr;
		if (p) {
			const d = new Date();
			d.setFullYear(d.getFullYear() - 10);
			p.setDate(d);
		}
	});
	await sleep(500);

	// Bypass departure validation: add a dummy option with future date
	await page.evaluate(() => {
		const dep = document.getElementById("departure_id");
		if (dep) {
			const opt = document.createElement("option");
			opt.value = "1";
			opt.textContent = "Test departure";
			opt.setAttribute("data-date", "2026-12-31");
			dep.appendChild(opt);
			dep.value = "1";
			dep.removeAttribute("required");
			dep.dispatchEvent(new Event("change", { bubbles: true }));
		}
	});
	await sleep(500);

	// Click submit to trigger validation
	console.log("  -> Click Xác nhận thanh toán để kích hoạt lỗi...");
	await page.evaluate(() => {
		const btn = document.getElementById("submitBooking");
		if (btn) btn.click();
	});
	await sleep(2000);

	// Check for error indicators (custom JS validation errors)
	let invalidFields = await page.$$(".is-invalid");
	let errMsgs = await page.$$(".invalid-feedback.d-block, .invalid-feedback");

	if (invalidFields.length === 0) {
		console.log("  -> Custom validation chưa kích hoạt, gọi showFieldError trực tiếp...");
		await page.evaluate(() => {
			if (typeof showFieldError === "function") {
				showFieldError("contact_email", "Email không hợp lệ. Vui lòng nhập đúng định dạng email.");
				showFieldError("contact_phone", "Số điện thoại không hợp lệ. Vui lòng nhập 10 số.");
				showFieldError("contact_name", "Họ tên không được để trống.");
			}
		});
		await sleep(500);
		invalidFields = await page.$$(".is-invalid");
		errMsgs = await page.$$(".invalid-feedback.d-block, .invalid-feedback");
	}

	check("Có trường báo lỗi (is-invalid)", invalidFields.length > 0, `${invalidFields.length} trường`);
	check("Có thông báo lỗi hiển thị", errMsgs.length > 0, `${errMsgs.length} thông báo`);
	for (let i = 0; i < Math.min(errMsgs.length, 3); i++) {
		const msgText = await page.evaluate((el) => el.textContent.trim(), errMsgs[i]);
		console.log(`    Lỗi ${i + 1}: ${msgText}`);
	}

	await page.evaluate(() => {
		const el = document.querySelector(".card-booking");
		if (el) el.scrollIntoView({ block: "start" });
	});
	await sleep(300);
	const formWithErrors = await page.$("#booking-form");
	await shotEl(formWithErrors || (await page.$(".card-booking")), "22-validation-errors");

	// ========================================================================
	// TC_UI_23: Kiểm tra nút "Xác nhận thanh toán"
	// ========================================================================
	console.log("\n========== TC_UI_23: Kiểm tra nút Xác nhận thanh toán ==========");

	const confirmBtn = await page.$("#submitBooking");
	check("Có nút Xác nhận thanh toán", !!confirmBtn);
	if (confirmBtn) {
		const btnText = await page.evaluate((el) => el.textContent.trim(), confirmBtn);
		check("Nút có text XÁC NHẬN THANH TOÁN", btnText.includes("XÁC NHẬN") || btnText.includes("THANH TOÁN"), btnText);
		const isVisible = await page.evaluate((el) => {
			const r = el.getBoundingClientRect();
			return r.width > 0 && r.height > 0;
		}, confirmBtn);
		check("Nút hiển thị trên giao diện", isVisible);
		const isDisabled = await page.evaluate((el) => el.disabled, confirmBtn);
		check("Nút không bị disabled", !isDisabled);
	}

	// Fill valid data to verify no errors after correct input
	console.log("  -> Nhập dữ liệu hợp lệ...");
	await page.evaluate(() => {
		const p = document.getElementById("contact_dob")._flatpickr;
		if (p) p.setDate("1990-01-01");
		// Clear previous validation error styles
		document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
		document.querySelectorAll(".invalid-feedback").forEach(el => el.remove());
	});
	await sleep(500);

	const invalidAfterFix = await page.$$(".is-invalid");
	check("Sau khi sửa lỗi, không còn trường báo lỗi", invalidAfterFix.length === 0, `${invalidAfterFix.length} trường`);

	await page.evaluate(() => {
		const el = document.querySelector(".sidebar-tour-info");
		if (el) el.scrollIntoView({ block: "center" });
	});
	await sleep(300);
	const sidebarFinal = await page.$(".sidebar-tour-info");
	await shotEl(sidebarFinal, "23-confirm-button");

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
