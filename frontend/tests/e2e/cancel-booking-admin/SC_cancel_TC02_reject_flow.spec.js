const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const mockApi = require("./mock-api");
const DIR = path.resolve(__dirname, "screenshots", "TC02-reject-flow");
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Xóa screenshot cũ trước khi chạy
fs.rmSync(DIR, { recursive: true, force: true });
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

  const login = async (page, email, password) => {
    console.log(`  -> Đăng nhập ${email}...`);
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

  let userPage, adminPage;

  try {
    // ====================================================================
    // PHASE 1: User (nam) - Gửi yêu cầu hủy
    // Step 1: User sends cancellation request
    // ====================================================================
    console.log("\n========== PHASE 1: NGƯỜI DÙNG GỬI YÊU CẦU HỦY ==========");
    userPage = await browser.newPage();

    const userMock = mockApi.setupMocks(userPage);
    await userMock.setupInterception();
    console.log("  => Mock API đã sẵn sàng (KHÔNG chạm DB thật)");

    // Step 1a: Login as nam
    await login(userPage, "nam@gmail.com", "123456");
    await shot(userPage, "01-user-login");
    console.log("  => Đăng nhập nam thành công (mock)");

    // Step 1b: Go to booking details
    console.log("\n========== BƯỚC 2: CHI TIẾT BOOKING ==========");
    await userPage.goto(`${BASE_URL}/pages/user/booking-details.html?id=999`, {
      waitUntil: "networkidle0",
    });
    await sleep(3000);
    await shot(userPage, "02-booking-detail");

    // Find and click cancel button
    let cancelBtn = await userPage.$("#booking-actions .btn-outline-danger");
    if (!cancelBtn) {
      console.log("  => Chờ nút hủy xuất hiện...");
      await sleep(3000);
      cancelBtn = await userPage.$("#booking-actions .btn-outline-danger");
    }

    if (cancelBtn) {
      // Step 1c: Click cancel → modal
      console.log("\n========== BƯỚC 3: MODAL XÁC NHẬN HỦY ==========");
      await cancelBtn.click();
      await sleep(1500);

      // Read modal info
      const modalInfo = await userPage.evaluate(() => {
        const g = (id) => (document.getElementById(id) || {}).textContent || "N/A";
        return {
          depDate: g("modal-dep-date"),
          daysLeft: g("modal-days-left"),
          totalPrice: g("modal-total-price"),
          penalty: g("modal-penalty-percent"),
          refund: g("modal-refund-amount"),
        };
      });
      console.log(`  => Ngày KH: ${modalInfo.depDate}`);
      console.log(`  => Còn: ${modalInfo.daysLeft}`);
      console.log(`  => Tổng: ${modalInfo.totalPrice}`);
      console.log(`  => Phí hủy: ${modalInfo.penalty}`);
      console.log(`  => Hoàn: ${modalInfo.refund}`);
      await shot(userPage, "03-cancel-modal");

      // Step 1d: Confirm cancel
      console.log("\n========== BƯỚC 4: XÁC NHẬN HỦY ==========");
      const confirmBtn = await userPage.$("#confirm-cancel-btn");
      if (confirmBtn) {
        await confirmBtn.click();
        console.log("  -> Đã click Chắc chắn Hủy");
        await sleep(3000);

        // Wait for toast or reload
        try {
          await userPage.waitForFunction(
            () =>
              document.querySelector(".toast") ||
              document.querySelector("#booking-actions .badge"),
            { timeout: 10000 },
          );
        } catch (e) {}
        await sleep(1000);

        const badgeText = await userPage
          .$eval("#booking-actions", (el) => el.textContent)
          .catch(() => "");
        console.log(`  => Booking actions: ${badgeText.substring(0, 100)}`);
        await shot(userPage, "04-after-cancel-request");
      }
    } else {
      console.log("  => ⚠️ Không thấy nút Yêu cầu hủy");
    }

    // ====================================================================
    // PHASE 2: Admin (booking-staff) - TỪ CHỐI yêu cầu hủy
    // Steps 5-6: Admin rejects the cancellation request
    // ====================================================================
    console.log("\n\n========== PHASE 2: ADMIN TỪ CHỐI YÊU CẦU HỦY ==========");
    adminPage = await browser.newPage();

    const adminMock = mockApi.setupMocks(adminPage);
    // Sync state: booking is now in "pending" cancel request
    adminMock.bookingState.status = "pending";
    adminMock.bookingState.payment_status = "pending";
    adminMock.adminBookingState.status = "pending";
    adminMock.adminBookingState.payment_status = "pending";
    await adminMock.setupInterception();

    // Step 5a: Admin login
    await login(adminPage, "booking-staff@gmail.com", "123456");
    await shot(adminPage, "05-admin-login");

    // Step 5b: Go to admin booking detail
    console.log("\n========== BƯỚC 6: ADMIN BOOKING DETAIL ==========");
    await adminPage.goto(`${BASE_URL}/pages/admin/booking-details.html?id=999`, {
      waitUntil: "networkidle0",
    });
    await sleep(2000);
    await adminPage.evaluate(() => {
      if (typeof window.initAdminBookingDetailsPage === "function")
        window.initAdminBookingDetailsPage();
    });
    await sleep(3000);
    await shot(adminPage, "06-admin-booking-detail");

    // Step 5c: Verify cancellation action area is visible
    const showModalBtn = await adminPage.$("#btn-show-cancel-modal");
    if (showModalBtn) {
      console.log("  => ✅ Tìm thấy nút Phê duyệt hủy tour & Hoàn tiền");

      // Step 5d: Click "Phê duyệt hủy tour & Hoàn tiền" → show modal
      console.log("\n========== BƯỚC 7: MỞ MODAL PHÊ DUYỆT ==========");
      await showModalBtn.click();
      await sleep(1500);

      // Read admin modal info
      const adminModalInfo = await adminPage.evaluate(() => {
        const g = (id) => (document.getElementById(id) || {}).textContent || "N/A";
        return {
          reqDate: g("modal-req-date"),
          daysLeft: g("modal-admin-days-left"),
          penalty: g("modal-admin-penalty-percent"),
          refund: g("modal-refund-amount"),
        };
      });
      console.log(`  => Ngày yêu cầu: ${adminModalInfo.reqDate}`);
      console.log(`  => Còn: ${adminModalInfo.daysLeft}`);
      console.log(`  => Phí: ${adminModalInfo.penalty}`);
      console.log(`  => Hoàn: ${adminModalInfo.refund}`);
      await shot(adminPage, "07-admin-cancel-modal");

      // Step 5e: Click "Từ chối yêu cầu"
      console.log("\n========== BƯỚC 8: TỪ CHỐI YÊU CẦU ==========");
      const rejectBtn = await adminPage.$("#btn-reject-cancel");
      if (rejectBtn) {
        await rejectBtn.click();
        console.log("  -> Đã click Từ chối yêu cầu");
        await sleep(1500);

        // Step 5f: Wait for global confirm dialog
        console.log("\n========== BƯỚC 9: XÁC NHẬN TỪ CHỐI ==========");
        try {
          await adminPage.waitForSelector("#globalConfirmModal.show", {
            timeout: 5000,
          });
          console.log("  => Dialog xác nhận hiển thị");
        } catch (e) {
          console.log("  -> Chờ dialog xác nhận...");
          await sleep(2000);
        }
        await shot(adminPage, "08-confirm-dialog");

        // Step 6: Click "Đồng ý" to confirm rejection
        const confirmRejectBtn = await adminPage.$("#globalConfirmSubmit");
        if (confirmRejectBtn) {
          await confirmRejectBtn.click();
          console.log("  -> Đã click Đồng ý (xác nhận từ chối)");
          await sleep(3000);

          // Wait for toast success
          try {
            await adminPage.waitForFunction(
              () => {
                const toast = document.querySelector(".toast");
                return toast && window.getComputedStyle(toast).display !== "none";
              },
              { timeout: 8000 },
            );
          } catch (e) {}
          await sleep(1000);

          // Verify toast success message
          const toastText = await adminPage
            .$eval(".toast-body", (el) => el.textContent)
            .catch(() => "N/A");
          console.log(`  => Toast: ${toastText}`);
          await shot(adminPage, "09-reject-success-toast");

          // Wait for page reload after success
          console.log("  -> Chờ reload sau khi từ chối...");
          await sleep(3000);

          // Re-initialize page after reload to verify state
          await adminPage.evaluate(() => {
            if (typeof window.initAdminBookingDetailsPage === "function")
              window.initAdminBookingDetailsPage();
          });
          await sleep(2000);

          // Verify booking is back to confirmed
          const bookingStatusText = await adminPage
            .$eval("#booking-id-title", (el) => el.textContent)
            .catch(() => "N/A");
          console.log(`  => Trạng thái booking: ${bookingStatusText}`);

          // Check cancellation area is now hidden
          const cancelArea = await adminPage.$("#cancellation-action-area");
          let cancelAreaDisplay = "N/A";
          if (cancelArea) {
            cancelAreaDisplay = await cancelArea.evaluate(
              (el) => window.getComputedStyle(el).display,
            );
          }
          console.log(`  => Khu vực hủy: ${cancelAreaDisplay}`);

          if (cancelAreaDisplay === "none") {
            console.log("  ✅ Khu vực phê duyệt hủy đã ẩn (booking về confirmed)");
          }
          await shot(adminPage, "10-admin-booking-confirmed");
        } else {
          console.log("  => ⚠️ Không tìm thấy nút Đồng ý trong dialog");
        }
      } else {
        console.log("  => ⚠️ Không tìm thấy nút Từ chối yêu cầu");
      }
    } else {
      console.log("  => ⚠️ Không tìm thấy nút Phê duyệt (booking chưa pending?)");
    }

    // Verify mock state updated correctly
    console.log(`\n  => Mock booking status: ${adminMock.bookingState.status}`);
    console.log(`  => Mock payment status: ${adminMock.bookingState.payment_status}`);

    if (
      adminMock.bookingState.status === "confirmed" &&
      adminMock.bookingState.payment_status === "paid"
    ) {
      console.log("  ✅ Mock state đã cập nhật về confirmed + paid");
    }

    // ====================================================================
    // PHASE 3: User (nam) kiểm tra lại - Step 7
    // ====================================================================
    console.log("\n\n========== PHASE 3: NGƯỜI DÙNG KIỂM TRA LẠI ==========");

    // Sync user mock state from admin (pending → confirmed)
    userMock.bookingState.status = "confirmed";
    userMock.bookingState.payment_status = "paid";

    await userPage.goto(`${BASE_URL}/pages/user/booking-details.html?id=999`, {
      waitUntil: "networkidle0",
    });
    await sleep(3000);
    await shot(userPage, "11-user-booking-confirmed");

    // Verify booking status shows "Đã xác nhận"
    const userStatus = await userPage
      .$eval("#booking-status", (el) => el.textContent)
      .catch(() => "N/A");
    console.log(`  => User - Trạng thái booking: ${userStatus}`);

    if (userStatus.includes("Đã xác nhận")) {
      console.log("  ✅ Booking đã trở về 'Đã xác nhận'");
    }

    // Verify cancel button appears again
    const userCancelBtn = await userPage.$("#booking-actions .btn-outline-danger");
    if (userCancelBtn) {
      const btnText = await userPage.evaluate(
        (el) => el.textContent,
        userCancelBtn,
      );
      console.log(`  ✅ Nút 'Yêu cầu hủy' xuất hiện lại: ${btnText.trim()}`);
    } else {
      console.log("  => ⚠️ Không thấy nút Yêu cầu hủy");
    }

    // ====================================================================
    // TỔNG KẾT
    // ====================================================================
    console.log("\n============================================");
    console.log(`✅ TC02 REJECT FLOW HOÀN TẤT - ${step} ảnh đã lưu`);
    console.log(`📁 Thư mục: ${DIR}`);
    console.log("============================================\n");
    console.log("Trình duyệt sẽ đóng sau 10 giây...");
    await sleep(10000);
  } catch (err) {
    console.error(`\n❌ LỖI: ${err.message}`);
    try {
      const p = userPage || (await browser.newPage());
      await p.screenshot({ path: path.join(DIR, "error.png"), fullPage: true });
      console.log("  >> Đã chụp ảnh lỗi");
    } catch (e) {}
  } finally {
    try {
      await browser.close();
    } catch (e) {}
    console.log("Đã đóng trình duyệt");
  }
})();
