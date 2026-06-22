const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const DIR = path.resolve(__dirname, "screenshots", "TC01-cancel-flow");
const BASE_URL = "http://localhost:3000";
const DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "12345",
	database: "db_viet_tour",
	port: 3307,
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
	// RESET DB: chạy seed.sql trước khi test (riêng biệt, ko ảnh hưởng main)
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

	const login = async (page, email, password, label) => {
		console.log(`\n  --- Đăng nhập ${label} ---`);
		await page.goto(`${BASE_URL}/pages/auth/login.html`, {
			waitUntil: "networkidle0",
		});
		await page.waitForSelector("#loginForm");
		await sleep(500);
		await page.type("#username", email, { delay: 30 });
		await page.type("#password", password, { delay: 30 });
		await page.click('button[type="submit"]');
		await page.waitForFunction(() => localStorage.getItem("token") !== null, {
			timeout: 8000,
		});
		await page
			.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })
			.catch(() => {});
		await sleep(1000);
	};

	let userContext, adminContext, userPage, adminPage;

	try {
	// ====================================================================
		// PHASE 1: User (nam) - Gửi yêu cầu hủy booking 88
		// ====================================================================
		console.log("\n========== PHASE 1: NGƯỜI DÙNG GỬI YÊU CẦU HỦY ==========");
		userContext = await browser.createBrowserContext();
		userPage = await userContext.newPage();

		// Bước 1: Đăng nhập (nam)
		await login(userPage, "nam@gmail.com", "123456", "nam@gmail.com");
		await shot(userPage, "01-user-login");

		// Bước 2: Vào lịch sử đặt tour
		console.log("\n========== BƯỚC 2: LỊCH SỬ ĐẶT TOUR ==========");
		await userPage.goto(`${BASE_URL}/pages/user/bookings-history.html`, {
			waitUntil: "networkidle0",
		});
		await sleep(2000);
		// Chờ danh sách booking render
		try {
			await userPage.waitForSelector("#booking-list-body", { timeout: 8000 });
		} catch (e) {}
		await sleep(500);
		await shot(userPage, "02-booking-history");
		const bookingLinks = await userPage.$$(
			'a[href*="booking-details.html?id="]',
		);
		console.log(`  => Tìm thấy ${bookingLinks.length} booking`);

		// Bước 3: Click vào booking 88
		console.log("\n========== BƯỚC 3: CHI TIẾT BOOKING ==========");
		await userPage.goto(`${BASE_URL}/pages/user/booking-details.html?id=88`, {
			waitUntil: "networkidle0",
		});
		await sleep(3000);
		try {
			await userPage.waitForSelector("#booking-actions", { timeout: 8000 });
		} catch (e) {}
		await sleep(500);
		await shot(userPage, "03-booking-detail");

		// Kiểm tra nút "Yêu cầu hủy"
		const cancelBtn = await userPage.$("#booking-actions .btn-outline-danger");
		if (!cancelBtn)
			console.log(
				"  => ⚠️ Không tìm thấy nút Yêu cầu hủy (có thể đã hủy trước đó)",
			);
		else {
			// Bước 4: Click "Yêu cầu hủy" → modal
			console.log("\n========== BƯỚC 4: NHẤN YÊU CẦU HỦY ==========");
			await cancelBtn.click();
			await sleep(1000);
			try {
				await userPage.waitForSelector("#cancelRequestModal", {
					timeout: 5000,
				});
			} catch (e) {}
			await sleep(500);
			await shot(userPage, "04-cancel-modal");

			// Đọc thông tin trong modal
			const depDate = await userPage
				.$eval("#modal-dep-date", (el) => el.textContent)
				.catch(() => "N/A");
			const daysLeft = await userPage
				.$eval("#modal-days-left", (el) => el.textContent)
				.catch(() => "N/A");
			const totalPrice = await userPage
				.$eval("#modal-total-price", (el) => el.textContent)
				.catch(() => "N/A");
			const penalty = await userPage
				.$eval("#modal-penalty-percent", (el) => el.textContent)
				.catch(() => "N/A");
			const refund = await userPage
				.$eval("#modal-refund-amount", (el) => el.textContent)
				.catch(() => "N/A");
			console.log(`  => Ngày khởi hành: ${depDate}`);
			console.log(`  => Số ngày còn lại: ${daysLeft}`);
			console.log(`  => Tổng tiền: ${totalPrice}`);
			console.log(`  => Phí hủy: ${penalty}`);
			console.log(`  => Số tiền hoàn: ${refund}`);

			// Bước 5: Click "Chắc chắn Hủy"
			console.log("\n========== BƯỚC 5: XÁC NHẬN HỦY ==========");
			const confirmBtn = await userPage.$("#confirm-cancel-btn");
			if (confirmBtn) {
				await confirmBtn.click();
				console.log("  -> Đã click Chắc chắn Hủy, chờ kết quả...");
				await sleep(2000);

				// Chờ reload sau toast
				try {
					await userPage.waitForFunction(
						() =>
							document.querySelector(".toast") ||
							document.querySelector(".swal2-container") ||
							document.querySelector("#booking-actions .badge"),
						{ timeout: 10000 },
					);
				} catch (e) {}
				await sleep(1000);

				// Kiểm tra badge "Yêu cầu hủy tour đang chờ xử lý"
				const pendingBadge = await userPage.$("#booking-actions span.badge");
				if (pendingBadge) {
					const badgeText = await userPage.evaluate(
						(el) => el.textContent,
						pendingBadge,
					);
					console.log(`  => Badge hiển thị: ${badgeText}`);
				}
				await shot(userPage, "05-after-cancel-request");

			// Reload để đảm bảo UI đã cập nhật
			await userPage.reload({ waitUntil: "networkidle0" });
			await sleep(1500);
			await shot(userPage, "05b-after-reload");
			}
		}

		// ====================================================================
		// PHASE 2: Admin (booking-staff) - Quản lý booking → phê duyệt hủy + VNPay
		// ====================================================================
		console.log("\n\n========== PHASE 2: ADMIN PHÊ DUYỆT HỦY ==========");
		adminContext = await browser.createBrowserContext();
		adminPage = await adminContext.newPage();

		// Bước 6: Đăng nhập admin
		await login(
			adminPage,
			"booking-staff@gmail.com",
			"123456",
			"booking-staff@gmail.com",
		);
		await shot(adminPage, "06-admin-login");

		// Bước 7-8: Vào admin dashboard → Quản lý booking
		console.log("\n========== BƯỚC 7: VÀO ADMIN ==========");
		await adminPage.goto(
			`${BASE_URL}/pages/admin/dashboard.html?page=booking`,
			{
				waitUntil: "networkidle0",
			},
		);
		console.log("  -> Đã load admin dashboard, chờ booking list...");
		await sleep(3000);

		// Chờ bảng booking load
		try {
			await adminPage.waitForSelector("#booking-list-body", {
				timeout: 10000,
			});
			// Chờ ít nhất 1 dòng có BOK trong table
			await adminPage.waitForFunction(
				() => {
					const rows = document.querySelectorAll(
						"#booking-list-body tr",
					);
					return rows.length > 0;
				},
				{ timeout: 10000 },
			);
		} catch (e) {
			console.log("  -> Chờ thêm 5s cho booking list render...");
			await sleep(5000);
		}
		await sleep(500);
		await shot(adminPage, "07-admin-booking-list");

		// Bước 8: Tìm đúng booking 88 (BOK088) mà user vừa gửi yêu cầu hủy
		console.log("\n========== BƯỚC 8: CHỌN BOOKING ==========");
		const found = await adminPage.evaluate(() => {
			const rows = document.querySelectorAll("#booking-list-body tr");
			for (const row of rows) {
				if (row.textContent.includes("BOK088")) {
					row.click();
					return true;
				}
			}
			return false;
		});
		if (found) {
			console.log("  => Đã click vào BOK088");
			await sleep(2000);

			// Debug: log URL và booking ID hiện tại
			const currentUrl = adminPage.url();
			const urlParams = new URLSearchParams(currentUrl.split("?")[1] || "");
			const currentBookingId = urlParams.get("id") || "N/A";
			console.log(`  => URL hiện tại: ${currentUrl}`);
			console.log(`  => Booking ID trên URL: ${currentBookingId}`);

			// Chờ SPA load booking-detail: đợi status badge render hẳn
			try {
				await adminPage.waitForFunction(
					() => {
						const el = document.getElementById("booking-status");
						return el && el.textContent.trim() !== "";
					},
					{ timeout: 15000 },
				);
				await sleep(1500);
			} catch (e) {
				console.log("  -> Chờ thêm SPA render...");
				await sleep(4000);
			}
			// Debug: đọc trạng thái booking từ giao diện
			const debugBookingCode = await adminPage
				.$eval("#booking-id-title", (el) => el.textContent)
				.catch(() => "N/A");
			const debugStatus = await adminPage
				.$eval("#booking-status", (el) => el.textContent)
				.catch(() => "N/A");
			console.log(`  => Booking title: ${debugBookingCode.trim()}`);
			console.log(`  => Booking status: ${debugStatus.trim()}`);

			await shot(adminPage, "08-admin-booking-detail");

			// Kiểm tra khu vực hủy (đợi cancellation area hiện ra)
			let cancelArea = await adminPage.$("#cancellation-action-area");
			if (cancelArea) {
				let display = await cancelArea.evaluate(
					(el) => window.getComputedStyle(el).display,
				);
				if (display === "none") {
					console.log("  -> Chờ cancellation area hiện...");
					try {
						await adminPage.waitForFunction(
							() => {
								const el = document.getElementById("cancellation-action-area");
								return el && window.getComputedStyle(el).display !== "none";
							},
							{ timeout: 10000 },
						);
					} catch (e) {}
					cancelArea = await adminPage.$("#cancellation-action-area");
				}
			}
			const cancelAreaDisplay = cancelArea
				? await cancelArea.evaluate((el) => window.getComputedStyle(el).display)
				: "none";
			console.log(`  => Khu vực hủy: ${cancelAreaDisplay}`);

			if (cancelArea && cancelAreaDisplay !== "none") {
				// Bước 9: Click "Phê duyệt hủy tour & Hoàn tiền" → modal
				console.log("\n========== BƯỚC 9: MỞ MODAL PHÊ DUYỆT ==========");
				const showModalBtn = await adminPage.$("#btn-show-cancel-modal");
				if (showModalBtn) {
					await showModalBtn.click();

					// Chờ modal hiện + nội dung load đầy đủ
					try {
						await adminPage.waitForSelector("#cancel-confirm-modal.show", {
							timeout: 5000,
						});
						await adminPage.waitForFunction(
							() => {
								const el = document.getElementById("modal-refund-amount");
								return el && el.textContent.trim() !== "" && !el.textContent.includes("0đ");
							},
							{ timeout: 10000 },
						);
						await sleep(300);
					} catch (e) {
						await sleep(2000);
					}
					await shot(adminPage, "09-admin-cancel-modal");

					// Bước 10: Modal hiển thị phí hủy, số tiền hoàn
					const adminDepDate = await adminPage
						.$eval("#modal-req-date", (el) => el.textContent)
						.catch(() => "N/A");
					const adminDaysLeft = await adminPage
						.$eval("#modal-admin-days-left", (el) => el.textContent)
						.catch(() => "N/A");
					const adminPenalty = await adminPage
						.$eval("#modal-admin-penalty-percent", (el) => el.textContent)
						.catch(() => "N/A");
					const adminRefund = await adminPage
						.$eval("#modal-refund-amount", (el) => el.textContent)
						.catch(() => "N/A");
					console.log(`  => Ngày yêu cầu: ${adminDepDate}`);
					console.log(`  => Số ngày còn lại: ${adminDaysLeft}`);
					console.log(`  => Phí phạt: ${adminPenalty}`);
					console.log(`  => Số tiền hoàn: ${adminRefund}`);

					// Bước 11: Click phê duyệt → redirect VNPay sandbox
					console.log("\n========== BƯỚC 11: PHÊ DUYỆT HỦY ==========");
					const approveBtn = await adminPage.$("#btn-approve-cancel");
					if (approveBtn) {
						await approveBtn.click();
						console.log("  -> Đã click Phê duyệt, chờ redirect VNPay...");
						await sleep(3000);

						// Chờ redirect sang VNPay sandbox
						let onVnpayRefund = false;
						for (let i = 0; i < 30; i++) {
							await sleep(1000);
							const url = adminPage.url();
							if (url.includes("sandbox.vnpayment.vn")) {
								console.log("  => Redirect sang VNPay hoàn tiền thành công!");
								onVnpayRefund = true;
								// Đợi VNPay page load hoàn chỉnh
								try {
									await adminPage.waitForSelector("body", {
										timeout: 10000,
									});
									await adminPage.waitForFunction(
										() => document.readyState === "complete",
										{ timeout: 10000 },
									);
									await sleep(2000);
								} catch (e) {
									await sleep(3000);
								}
								break;
							}
							if (i === 5) console.log("  -> (Đang chờ redirect VNPay...)");
							if (i === 10)
								console.log("  -> (Kiểm tra API create-refund-url...)");
							if (i === 15) console.log("  -> (Có thể lỗi API)");
						}

						await shot(adminPage, "10-vnpay-refund-sandbox");

						// Bước 12: Chờ người dùng thao tác thủ công trên VNPay
						if (onVnpayRefund) {
							console.log("");
							console.log("══════════════════════════════════════════════");
							console.log("  VUI LÒNG XỬ LÝ HOÀN TIỀN TRÊN VNPay");
							console.log("  Chrome đang mở trang VNPay Sandbox Refund");
							console.log("  Thao tác thủ công để hoàn tất giao dịch");
							console.log("  Sau khi hoàn tiền thành công trên VNPay,");
							console.log("  trình duyệt sẽ tự động chuyển về trang");
							console.log("  kết quả. Script sẽ chụp ảnh kết quả đó.");
							console.log("");
							console.log("  Thẻ test VNPay:");
							console.log("  - NCB: 9704198526191432198 (12/25, OTP: 123456)");
							console.log("══════════════════════════════════════════════");
							console.log("");

							// Chờ redirect về app (qua VNPay callback)
							try {
								await adminPage.waitForFunction(
									() => !window.location.href.includes("sandbox.vnpayment.vn"),
									{ timeout: 300000 },
								);
								console.log("  => Đã rời khỏi VNPay!");
							} catch (e) {
								console.log("  => Hết thời gian chờ (5 phút)");
							}

							// Đợi VNPay callback redirect (nếu đang ở /api/bookings/vnpay-refund)
							for (let i = 0; i < 15; i++) {
								await sleep(1000);
								const url = adminPage.url();
								if (
									url.includes("dashboard.html") ||
									url.includes("booking-details")
								)
									break;
								if (i === 5)
									console.log("  -> Chờ redirect từ VNPay callback...");
							}
							await sleep(2000);

							const afterUrl = adminPage.url();
							console.log(`  => URL sau VNPay: ${afterUrl.substring(0, 100)}`);

							// Nếu vẫn đang ở trang lạ, load lại admin booking detail
							if (
								!adminPage.url().includes("dashboard.html") &&
								!adminPage.url().includes("admin")
							) {
								await adminPage.goto(
									`${BASE_URL}/pages/admin/dashboard.html?page=booking-details&id=88`,
									{ waitUntil: "networkidle0" },
								);
							}

							// Đợi booking detail render + refund card hiển thị đầy đủ
							try {
								await adminPage.waitForFunction(
									() => {
										const el = document.getElementById("booking-status");
										return el && el.textContent.trim() !== "";
									},
									{ timeout: 10000 },
								);
								await adminPage.waitForFunction(
									() => {
										const card = document.getElementById("refund-receipt-card");
										const amount = document.getElementById("refund-amount");
										return card && window.getComputedStyle(card).display !== "none"
											&& amount && amount.textContent.trim() !== "";
									},
									{ timeout: 10000 },
								);
								await sleep(500);
							} catch (e) {
								await sleep(3000);
							}

							// Chụp kết quả hoàn tiền thành công
							await shot(adminPage, "11-refund-success-dialog");

							// Kiểm tra dialog/card hoàn tiền
							let refundReceiptCard = await adminPage.$("#refund-receipt-card");
							if (refundReceiptCard) {
								let cardDisplay = await refundReceiptCard.evaluate(
									(el) => window.getComputedStyle(el).display,
								);
								if (cardDisplay === "none") {
									// Đợi thêm nếu chưa kịp render
									try {
										await adminPage.waitForFunction(
											() => {
												const el = document.getElementById(
													"refund-receipt-card",
												);
												return (
													el && window.getComputedStyle(el).display !== "none"
												);
											},
											{ timeout: 5000 },
										);
									} catch (e) {}
								}
								refundReceiptCard = await adminPage.$("#refund-receipt-card");
							}
							if (refundReceiptCard) {
								cardDisplay = await refundReceiptCard.evaluate(
									(el) => window.getComputedStyle(el).display,
								);
								if (cardDisplay !== "none") {
									console.log("  ✅ Refund receipt card hiển thị!");
									const refundAmount = await adminPage
										.$eval("#refund-amount", (el) => el.textContent)
										.catch(() => "N/A");
									const refundDate = await adminPage
										.$eval("#refund-date", (el) => el.textContent)
										.catch(() => "N/A");
									console.log(`  => Số tiền hoàn: ${refundAmount}`);
									console.log(`  => Ngày hoàn: ${refundDate}`);

									const bookingStatus = await adminPage
										.$eval("#booking-status", (el) => el.textContent)
										.catch(() => "N/A");
									const paymentStatus = await adminPage
										.$eval("#payment-status", (el) => el.textContent)
										.catch(() => "N/A");
									console.log(`  => Trạng thái: ${bookingStatus}`);
									console.log(`  => Thanh toán: ${paymentStatus}`);
								} else {
									console.log("  => ⚠️ Refund receipt card không hiển thị");
								}
							} else {
								console.log("  => ⚠️ Không tìm thấy refund receipt card");
							}

							// Shot 12: Booking detail (ẩn refund receipt card để thấy rõ thông tin)
							await adminPage.evaluate(() => {
								const card = document.getElementById("refund-receipt-card");
								if (card) card.style.display = "none";
								window.scrollTo(0, 0);
							});
							// Chờ ảnh tour load xong (tránh bóng sáng/tối)
							try {
								await adminPage.waitForFunction(
									() => {
										const imgs = document.querySelectorAll(".detail-grid img");
										return imgs.length > 0 && Array.from(imgs).every(
											(img) => img.complete && img.naturalWidth > 0,
										);
									},
									{ timeout: 8000 },
								);
								await sleep(300);
							} catch (e) {
								await sleep(1500);
							}
							await shot(adminPage, "12-admin-booking-cancelled");
							// Khôi phục lại
							await adminPage.evaluate(() => {
								const card = document.getElementById("refund-receipt-card");
								if (card) card.style.display = "";
							});
						}
					}
				}
			} else {
				console.log(
					"  => ⚠️ Khu vực hủy không hiển thị (booking chưa pending?)",
				);
			}
		} else {
			const tableContent = await adminPage
				.$eval("#booking-list-body", (el) => el.textContent)
				.catch(() => "N/A");
			console.log(
				`  => ⚠️ Không tìm thấy booking. Nội dung bảng: ${tableContent.substring(0, 200)}`,
			);
			await shot(adminPage, "08-no-booking-found");
		}

		// ====================================================================
		// PHASE 3: User (nam) kiểm tra lại
		// ====================================================================
		console.log("\n\n========== PHASE 3: NGƯỜI DÙNG KIỂM TRA ==========");

		// Bước 13: User kiểm tra
		await userPage.goto(`${BASE_URL}/pages/user/booking-details.html?id=88`, {
			waitUntil: "networkidle0",
		});

		// Đợi booking status render hẳn
		try {
			await userPage.waitForFunction(
				() => {
					const el = document.getElementById("booking-status");
					return el && el.textContent.trim() !== "";
				},
				{ timeout: 10000 },
			);
			await sleep(1500);
		} catch (e) {
			await sleep(3000);
		}
		await shot(userPage, "13-user-booking-cancelled");

		// Kiểm tra trạng thái
		const statusBadge = await userPage.$("#booking-actions span.badge");
		if (statusBadge) {
			const statusText = await userPage.evaluate(
				(el) => el.textContent,
				statusBadge,
			);
			console.log(`  => Trạng thái booking: ${statusText}`);
			if (statusText.includes("Đã hủy") || statusText.includes("huỷ")) {
				console.log("  ✅ Booking đã bị hủy thành công!");
			}
		}

		// Kiểm tra không còn nút hủy
		const hasCancelBtn = await userPage.$(
			"#booking-actions .btn-outline-danger",
		);
		if (!hasCancelBtn) {
			console.log("  ✅ Không còn nút Yêu cầu hủy (đã bị ẩn)");
		}

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
			if (adminContext) await adminContext.close();
			await browser.close();
		} catch (e) {}
		console.log("Đã đóng trình duyệt");
	}
})();
