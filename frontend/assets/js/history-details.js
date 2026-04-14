// Chi tiết booking của User
const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/pages/user/login.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // 2. Lấy ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get("id");

    if (!bookingId) {
        alert("Không tìm thấy mã đặt chỗ!");
        window.location.href = "bookings-history.html";
        return;
    }

    // 3. Load Components (Header, Sidebar, Footer)
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html"),
    ]);

    // 4. Fetch và Render dữ liệu
    fetchBookingDetail(bookingId, token);
});

async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const html = await res.text();
        target.innerHTML = html;

        // Xử lý scripts trong component (ví dụ: dropdown menu, sidebar active)
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

        // Kích hoạt sidebar nếu là side-placeholder
        if (targetId === "side-placeholder") {
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll(".user-nav-menu .nav-link");
            navLinks.forEach(link => {
                const href = link.getAttribute("href");
                if (currentPath.includes(href) || href.includes("bookings-history")) {
                    link.classList.add("active");
                }
            });
        }
    } catch (err) {
        console.error(`Lỗi khi load component ${filePath}:`, err);
    }
}

async function fetchBookingDetail(bookingId, token) {
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/details`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderBookingDetail(result.data);
        } else {
            console.error("Fetch booking detail error:", result.message);
            document.getElementById("booking-detail-content").innerHTML = `
                <div class="alert alert-danger py-5 text-center">
                    <i class="fa-solid fa-triangle-exclamation fa-3x mb-3"></i>
                    <h4>Lỗi khi lấy thông tin</h4>
                    <p>${result.message || "Đã có lỗi xảy ra"}</p>
                    <a href="bookings-history.html" class="btn btn-primary mt-3">Quay lại lịch sử</a>
                </div>
            `;
        }
    } catch (error) {
        console.error("System error:", error);
    }
}

function renderBookingDetail(booking) {
    // 1. Header Info
    document.getElementById("booking-code").textContent = `Mã đơn: BOK${String(booking.id).padStart(3, '0')}`;
    document.getElementById("booking-created-at").textContent = new Date(booking.created_at).toLocaleString("vi-VN");
    
    const statusBadge = document.getElementById("booking-status");
    const statusInfo = getStatusInfo(booking.status);
    statusBadge.textContent = statusInfo.label;
    statusBadge.className = `status-badge status-${statusInfo.class}`;

    // 2. Tour Info
    document.getElementById("tour-name").textContent = booking.tour_name;
    document.getElementById("tour-img").src = booking.tour_image || "/assets/images/placeholder.png";
    document.getElementById("tour-duration").textContent = booking.tour_duration || "Chưa cập nhật";
    document.getElementById("dep-date").textContent = new Date(booking.departure_date).toLocaleDateString("vi-VN");
    document.getElementById("dep-location").textContent = booking.departure_location;
    document.getElementById("booking-pax").textContent = `${booking.adults} Người lớn, ${booking.children} Trẻ em`;

    // 3. Contact Info
    document.getElementById("contact-name").textContent = booking.contact_name;
    document.getElementById("contact-phone").textContent = booking.contact_phone;
    document.getElementById("contact-email").textContent = booking.contact_email;

    // 4. Passenger List
    const passengerTableBody = document.getElementById("passenger-list");
    if (booking.passengers && booking.passengers.length > 0) {
        passengerTableBody.innerHTML = booking.passengers.map(p => `
            <tr>
                <td><strong>${p.fullname}</strong></td>
                <td><span class="passenger-type-tag type-${p.passenger_type}">${p.passenger_type === 'adult' ? 'Người lớn' : 'Trẻ em'}</span></td>
                <td>${p.gender}</td>
                <td>${p.dob ? new Date(p.dob).toLocaleDateString("vi-VN") : '---'}</td>
            </tr>
        `).join("");
    } else {
        passengerTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">Không có thông tin hành khách</td></tr>`;
    }

    // 5. Payment Summary
    const totalPriceFormatted = new Intl.NumberFormat("vi-VN").format(booking.total_price);
    document.getElementById("total-price").textContent = `${totalPriceFormatted}đ`;
    
    const paymentStatusEl = document.getElementById("payment-status");
    if (booking.payment_status === "paid") {
        paymentStatusEl.textContent = "Đã thanh toán";
        paymentStatusEl.className = "text-success font-weight-bold";
    } else {
        paymentStatusEl.textContent = "Chưa thanh toán";
        paymentStatusEl.className = "text-danger font-weight-bold";
    }

    // 6. Note
    if (booking.note && booking.note.trim() !== "") {
        document.getElementById("booking-note").textContent = booking.note;
        document.getElementById("booking-note").style.fontStyle = "normal";
        document.getElementById("booking-note").classList.remove("text-muted");
    }

    // Event In hóa đơn
    document.getElementById("print-booking").addEventListener("click", () => {
        window.print();
    });
}

function getStatusInfo(status) {
    switch (status) {
        case "confirmed":
            return { label: "Đã xác nhận", class: "confirmed" };
        case "cancelled":
            return { label: "Đã hủy", class: "cancelled" };
        case "pending":
            return { label: "Chờ xử lý", class: "pending" };
        default:
            return { label: status, class: "pending" };
    }
}
