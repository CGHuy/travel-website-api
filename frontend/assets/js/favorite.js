// Logic for Favorite Tours page
const API_URL = "http://localhost:3000/api";
let favoriteTours = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        window.location.href = "/pages/auth/login.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // Chỉ khách hàng (customer) mới được xem trang này
    // Sử dụng đúng format role theo DB (gạch ngang)
    const _fv_STAFF = ["admin", "booking-staff", "tour-staff"];
    if (_fv_STAFF.includes((user.role || "").toLowerCase())) {
        window.location.replace("/profile");
        return;
    }

    // Load components
    await Promise.all([loadComponent("header-placeholder", "../../components/header.html"), loadComponent("footer-placeholder", "../../components/footer.html"), loadComponent("side-placeholder", "../../components/user-sidebar.html")]);

    initFavoritePage();
    fetchFavorites(user.id, token);
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

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Handle static items
    const staticLinks = document.querySelectorAll(".nav-item-static a");
    staticLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.style.color = "#0056b3";
            link.querySelector("span").style.fontWeight = "600";
        }
    });
}

async function fetchFavorites(userId, token) {
    const favoriteList = document.getElementById("favorite-list");

    // Show loading state
    favoriteList.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Đang tải danh sách yêu thích...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/wishlist/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (response.ok && result.success) {
            favoriteTours = result.data;
            renderFavorites(favoriteTours);
        } else {
            favoriteList.innerHTML = `<div class="alert alert-danger">Lỗi: ${result.message || "Không thể tải dữ liệu"}</div>`;
        }
    } catch (error) {
        console.error("Fetch favorites error:", error);
        favoriteList.innerHTML = `<div class="alert alert-danger">Lỗi kết nối tới server</div>`;
    }
}

function renderFavorites(tours) {
    const favoriteList = document.getElementById("favorite-list");
    const noFavorites = document.getElementById("no-favorites");

    if (!tours || tours.length === 0) {
        favoriteList.classList.add("d-none");
        noFavorites.classList.remove("d-none");
        return;
    }

    favoriteList.classList.remove("d-none");
    noFavorites.classList.add("d-none");

    favoriteList.innerHTML = tours
        .map((tour) => {
            const priceFormatted = new Intl.NumberFormat("vi-VN").format(tour.price);
            return `
            <div class="favorite-card animate__animated animate__fadeIn" data-tour-id="${tour.tour_id}">
                <div class="favorite-img-side">
                    <button class="remove-favorite-btn" title="Gỡ khỏi danh sách" onclick="handleRemoveFavorite(${tour.tour_id})">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <img src="${tour.image_url || "/assets/images/placeholder.png"}" alt="${tour.tour_name}" class="favorite-img">
                </div>
                <div class="favorite-info-side">
                    <h4 class="favorite-tour-name">${tour.tour_name}</h4>
                    
                    <div class="meta-grid">
                        <div class="meta-item">
                            <i class="fa-solid fa-barcode"></i>
                            <span>Mã tour: <b>${"TOUR" + String(tour.tour_id).padStart(3, "0") || "N/A"}</b></span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>Khởi hành: <b>${tour.departure_location || "N/A"}</b></span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-regular fa-clock"></i>
                            <span>Thời gian: <b>${tour.duration || "N/A"}</b></span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-solid fa-map-marked-alt"></i>
                            <span>Khu vực: <b>${tour.region || "Miền Bắc"}</b></span>
                        </div>
                    </div>

                    <div class="favorite-footer">
                        <div class="price-container">
                            <span class="price-label">Giá chuẩn từ:</span>
                            <span class="price-value">${priceFormatted} <span>đ</span></span>
                        </div>
                        <a href="/pages/user/detail-tour.html?id=${tour.tour_id}" class="btn-view-detail">Xem chi tiết</a>
                    </div>
                </div>
            </div>
        `;
        })
        .join("");
}

let deleteModal;
let tourIdToDelete = null;

async function handleRemoveFavorite(tourId) {
    tourIdToDelete = tourId;
    if (!deleteModal) {
        deleteModal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
    }
    deleteModal.show();
}

async function executeRemoveFavorite(tourId) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    const card = document.querySelector(`.favorite-card[data-tour-id="${tourId}"]`);
    const confirmBtn = document.getElementById("confirmDeleteBtn");

    // Disable button and show loading
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xóa...';

    try {
        const response = await fetch(`${API_URL}/wishlist/${user.id}/${tourId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (response.ok && result.success) {
            deleteModal.hide();
            card.classList.add("animate__fadeOutLeft");
            card.addEventListener(
                "animationend",
                () => {
                    favoriteTours = favoriteTours.filter((t) => t.tour_id !== tourId);
                    renderFavorites(favoriteTours);
                },
                { once: true },
            );
        } else {
            alert("Lỗi: " + (result.message || "Không thể xóa tour"));
        }
    } catch (error) {
        console.error("Remove favorite error:", error);
        alert("Lỗi kết nối tới server");
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

function initFavoritePage() {
    // Add listener to confirm button in modal
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => {
            if (tourIdToDelete) {
                executeRemoveFavorite(tourIdToDelete);
            }
        });
    }

    // Search Filtering
    const searchInput = document.getElementById("searchFavorite");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = this.value.trim().toLowerCase();
            const filtered = favoriteTours.filter((tour) => tour.tour_name.toLowerCase().includes(query) || (tour.code && tour.code.toLowerCase().includes(query)) || (tour.departure_location && tour.departure_location.toLowerCase().includes(query)));
            renderFavorites(filtered);

            if (filtered.length === 0 && query !== "") {
                const noFavorites = document.getElementById("no-favorites");
                noFavorites.classList.remove("d-none");
                noFavorites.querySelector("h5").textContent = "Không tìm thấy kết quả phù hợp!";
            }
        });
    }
}
