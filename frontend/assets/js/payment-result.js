// payment-result.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Tải header/footer (Giữ nguyên giao diện mượt mà)
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html")
    ]);

    // 2. Phân tích URL Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const bookingId = urlParams.get("bookingId");
    const message = urlParams.get("message") || "Rất tiếc! Đã có lỗi xảy ra.";

    const resultContainer = document.getElementById("result-container");

    if (bookingId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập");

            // Chỉ lấy thông tin booking của ĐÚNG MÌNH. URL an toàn.
            const response = await fetch(`/api/bookings/${bookingId}/details`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const resData = await response.json();
            
            if (resData.success && resData.data) {
                const booking = resData.data;

                // LOGIC BẢO MẬT: Kiểm tra cứng trạng thái từ DB, bỏ qua thao túng URL
                if (booking.payment_status !== 'paid') {
                    showError("Giao dịch chưa được thanh toán thành công hoặc đã bị hủy.");
                    return;
                }

                const formattedPrice = new Intl.NumberFormat('vi-VN').format(booking.total_price) + " ₫";
                const depDate = new Date(booking.departure_date).toLocaleDateString('vi-VN');

                resultContainer.innerHTML = `
                    <div class="icon-box success-icon animate-up">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h2 class="fw-bold mb-3 text-dark">Thanh Toán Thành Công!</h2>
                    <p class="text-muted mb-4">Cảm ơn bạn đã lựa chọn VietTour. Chuyến đi của bạn đã được xác nhận.</p>
                    
                    <div class="bg-light p-4 rounded-4 mb-4 text-start">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="text-secondary small">Mã đơn đặt tour:</span>
                            <span class="fw-bold fs-5 text-dark">BOK${bookingId.toString().padStart(3, '0')}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Tên tour:</span>
                            <span class="fw-bold text-dark text-end" style="max-width: 60%;">${booking.tour_name}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Ngày khởi hành:</span>
                            <span class="fw-bold text-dark">${depDate}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Hành khách:</span>
                            <span class="fw-bold text-dark">${booking.adults} người lớn, ${booking.children} trẻ em</span>
                        </div>
                        <hr class="opacity-25 my-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-secondary fw-bold">Tổng thanh toán:</span>
                            <span class="fw-bold text-primary fs-4">${formattedPrice}</span>
                        </div>
                    </div>

                    <div class="d-flex flex-column gap-2">
                        <a href="/bookings-history" class="btn btn-home">Xem chi tiết đơn đặt chỗ</a>
                        <a href="/index" class="btn btn-link text-muted text-decoration-none">Về trang chủ</a>
                    </div>
                `;
                return;
            } else {
                showError("Không thể tìm thấy thông tin đơn hàng này.");
                return;
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin đơn hàng:", error);
            showError("Lỗi hệ thống khi tải dữ liệu đơn hàng.");
            return;
        }
    }

    // Nếu không có id hoặc có lỗi chung chung trên URL
    showError(message);

    function showError(msg) {
        resultContainer.innerHTML = `
            <div class="icon-box error-icon animate-up">
                <i class="fa-solid fa-xmark"></i>
            </div>
            <h2 class="fw-bold mb-3 text-dark">Nhắc Nhở Giao Dịch</h2>
            <p class="text-muted mb-4">${decodeURIComponent(msg)}</p>
            
            <div class="d-flex flex-column gap-2">
                <a href="/my-bookings" class="btn btn-outline-danger" style="border-radius: 12px; font-weight: 600; padding: 12px 24px;">Xem đơn hàng của tôi</a>
                <a href="/index" class="btn btn-link text-muted text-decoration-none">Về trang chủ</a>
            </div>
        `;
    }
});

async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const res = await fetch(filePath);
        const html = await res.text();
        target.innerHTML = html;

        if (filePath.includes("header.html")) {
            const scripts = target.querySelectorAll("script");
            scripts.forEach((script) => {
                const newScript = document.createElement("script");
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
                script.remove();
            });
        }
    } catch (error) {
        console.error("Không thể tải component:", error);
    }
}
