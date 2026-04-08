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

    if (status === "success") {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/bookings/${bookingId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const resData = await response.json();
            
            if (resData.success && resData.data) {
                const booking = resData.data;
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
                            <span class="fw-bold fs-5 text-dark">#${bookingId}</span>
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
                        <a href="/my-bookings" class="btn btn-home">Quản lý đơn hàng</a>
                        <a href="/index" class="btn btn-link text-muted text-decoration-none">Về trang chủ</a>
                    </div>
                `;
                return;
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin đơn hàng:", error);
        }

        // Fallback nếu không lấy được data chi tiết
        resultContainer.innerHTML = `
            <div class="icon-box success-icon animate-up">
                <i class="fa-solid fa-check"></i>
            </div>
            <h2 class="fw-bold mb-3 text-dark">Thanh Toán Thành Công!</h2>
            <p class="text-muted mb-4">Cảm ơn bạn đã lựa chọn VietTour. Chuyến đi của bạn đã được xác nhận.</p>
            
            <div class="bg-light p-3 rounded-4 mb-4 text-start">
                <p class="mb-1 text-secondary small">Mã đơn đặt tour:</p>
                <p class="mb-0 fw-bold fs-5 text-dark">#${bookingId}</p>
            </div>

            <div class="d-flex flex-column gap-2">
                <a href="/my-bookings" class="btn btn-home">Xem chi tiết đơn hàng</a>
                <a href="/index" class="btn btn-link text-muted text-decoration-none">Về trang chủ</a>
            </div>
        `;
    } else {
        resultContainer.innerHTML = `
            <div class="icon-box error-icon animate-up">
                <i class="fa-solid fa-xmark"></i>
            </div>
            <h2 class="fw-bold mb-3 text-dark">Giao Dịch Thất Bại</h2>
            <p class="text-muted mb-4">${decodeURIComponent(message)}</p>
            
            <div class="d-flex flex-column gap-2">
                <button onclick="window.history.back()" class="btn btn-outline-danger" style="border-radius: 12px; font-weight: 600; padding: 12px 24px;">Quay lại thử lại</button>
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
