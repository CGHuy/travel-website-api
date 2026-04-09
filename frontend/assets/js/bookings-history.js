// Logic for Booking History page
const API_URL = "http://localhost:3000/api";
let allBookings = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/pages/user/login.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // Load components
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html")
    ]);

    initBookingPage();
    fetchBookings();
});

async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const html = await res.text();
        target.innerHTML = html;

        // Execute any scripts within the loaded component
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

        // Re-run sidebar active state after it's loaded
        if (targetId === "side-placeholder") {
            initSidebarActiveState();
        }
    } catch (err) {
        console.error(`Failed to load component ${filePath}:`, err);
    }
}

function initSidebarActiveState() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".user-nav-menu .nav-link");
    
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Handle static items
    const staticLinks = document.querySelectorAll(".nav-item-static a");
    staticLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.style.color = "#0056b3";
            link.querySelector("span").style.fontWeight = "600";
        }
    });
}

async function fetchBookings() {
    const token = localStorage.getItem("token");
    const bookingList = document.getElementById("booking-list");
    
    // Show loading state
    bookingList.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Đang tải danh sách đơn hàng...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/bookings/my-bookings`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            allBookings = result.data;
            renderBookings(allBookings);
        } else {
            bookingList.innerHTML = `<div class="alert alert-danger">Lỗi: ${result.message || "Không thể tải dữ liệu"}</div>`;
        }
    } catch (error) {
        console.error("Fetch bookings error:", error);
        bookingList.innerHTML = `<div class="alert alert-danger">Lỗi kết nối tới server</div>`;
    }
}

function renderBookings(bookings) {
    const bookingList = document.getElementById("booking-list");
    
    if (!bookings || bookings.length === 0) {
        bookingList.innerHTML = `
            <div class="text-center py-5 bg-light rounded-3">
                <i class="fa-solid fa-calendar-xmark fa-3x mb-3 text-muted"></i>
                <p class="text-muted">Bạn chưa có đơn đặt chỗ nào.</p>
                <a href="/pages/user/list-tour.html" class="btn btn-primary">Khám phá tour ngay</a>
            </div>
        `;
        return;
    }

    bookingList.innerHTML = bookings.map(booking => {
        const createdAt = new Date(booking.created_at).toLocaleString('vi-VN');
        const statusInfo = getStatusInfo(booking.booking_status);
        const priceFormatted = new Intl.NumberFormat('vi-VN').format(booking.total_price);
        
        return `
            <div class="booking-item" data-id="${booking.id}">
                <div class="booking-date">Ngày tạo: ${createdAt}</div>
                <div class="booking-card">
                    <img src="${booking.cover_image || '/assets/images/placeholder.png'}" alt="${booking.tour_name}" class="booking-img">
                    <div class="booking-info">
                        <h4>${booking.tour_name}</h4>
                        <div class="info-row">
                            <i class="fa-solid fa-ticket"></i>
                            <span class="info-label">Mã booking:</span>
                            <span class="info-value">${booking.id}</span>
                        </div>
                        <div class="info-row">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span class="info-label">Ngày khởi hành:</span>
                            <span class="info-value">${new Date(booking.departure_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div class="info-row">
                            <i class="fa-solid fa-location-dot"></i>
                            <span class="info-label">Nơi khởi hành:</span>
                            <span class="info-value">${booking.departure_location}</span>
                        </div>
                        <div class="info-row">
                            <i class="fa-solid fa-users"></i>
                            <span class="info-label">Hành khách:</span>
                            <span class="info-value">${booking.adults} Người lớn, ${booking.children} Trẻ em</span>
                        </div>
                    </div>
                    <div class="booking-status-price">
                        <div class="status-tag ${statusInfo.class}">${statusInfo.label}</div>
                        <div class="booking-price">${priceFormatted} <span class="currency-symbol">đ</span></div>
                        <a href="/pages/user/booking-details.html?id=${booking.id}" class="btn btn-outline-primary btn-sm mt-3">Chi tiết</a>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function getStatusInfo(status) {
    switch (status) {
        case 'confirmed':
            return { label: 'Đã xác nhận', class: 'status-paid' };
        case 'cancelled':
            return { label: 'Đã hủy', class: 'status-canceled' };
        case 'pending':
            return { label: 'Chờ xử lý', class: 'status-pending' };
        default:
            return { label: status, class: '' };
    }
}

function initBookingPage() {
    // Filter Tabs Interaction
    const filterTabs = document.querySelectorAll(".filter-tab");
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const status = tab.dataset.status;
            filterBookings(status);
        });
    });

    // Search Interaction
    const searchInput = document.querySelector(".search-booking-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allBookings.filter(b => 
                b.id.toString().includes(query) || 
                b.tour_name.toLowerCase().includes(query)
            );
            renderBookings(filtered);
        });
    }
}

function filterBookings(status) {
    if (status === "all") {
        renderBookings(allBookings);
    } else {
        const filtered = allBookings.filter(b => {
            if (status === "paid") return b.booking_status === "confirmed";
            if (status === "canceled") return b.booking_status === "cancelled";
            if (status === "canceling") return b.booking_status === "pending";
            return false;
        });
        renderBookings(filtered);
    }
}
