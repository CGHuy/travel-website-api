// Khởi tạo header
async function initHeader() {
    await updateAuthUI();
    setupLogout();
    setupAvatarDropdown();
}

// Auto init khi script load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
} else {
    // DOM đã sẵn sàng, chạy sau 1 tick để đảm bảo HTML đã render
    setTimeout(initHeader, 0);
}

// Đồng bộ đăng nhập / đăng xuất giữa nhiều tab
window.addEventListener("storage", () => {
    updateAuthUI();
    closeUserDropdown();
});

async function getCurrentRoleFromBackend(token) {
    try {
        const response = await fetch("/api/auth/verify", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json();
        if (!result.success || !result.data || !result.data.user) {
            return null;
        }

        return String(result.data.user.role || "").toLowerCase();
    } catch (error) {
        console.warn("Không thể kiểm tra role từ backend:", error);
        return null;
    }
}

async function updateAdminNavVisibility(token) {
    const adminNavLink = document.getElementById("adminNavLink");
    if (!adminNavLink) return;

    // Ẩn mặc định
    adminNavLink.classList.add("d-none");

    if (!token) return;

    let role = "";
    try {
        // Ưu tiên lấy role từ localStorage để hiển thị tức thì (tránh flicker)
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            role = String(user.role || "").toLowerCase();
        }

        // Nếu localStorage không có hoặc cần verify lại, mới gọi backend
        if (!role) {
            role = await getCurrentRoleFromBackend(token);
        }
    } catch (e) {
        console.error("Lỗi lấy role:", e);
    }

    const canViewAdminRoles = new Set([
        "admin",
        "tour-staff",
        "booking-staff",
        "tour_staff",
        "booking_staff",
    ]);

    if (role && canViewAdminRoles.has(role)) {
        adminNavLink.classList.remove("d-none");
    }
}

// ================== AUTH UI ==================
async function updateAuthUI() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    await updateAdminNavVisibility(token);

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");

    console.log("updateAuthUI - token:", token ? "có" : "không");
    console.log("updateAuthUI - elements:", { loginBtn, registerBtn, userMenu });

    if (token && user) {
        // Đã đăng nhập: Ẩn nút login/register, hiện userMenu
        if (loginBtn) loginBtn.classList.add("d-none");
        if (registerBtn) registerBtn.classList.add("d-none");
        if (userMenu) userMenu.classList.remove("d-none");
        if (userName) userName.classList.remove("d-none");

        try {
            const userData = JSON.parse(user);
            const avatarImg = document.getElementById("userAvatar");

            if (avatarImg) {
                avatarImg.alt = userData.fullname;
            }

            if (userName) {
                userName.textContent = `Hi! ${userData.fullname}`;
            }
        } catch (err) {
            console.error("Không đọc được dữ liệu user:", err);
        }
    } else {
        // Chưa đăng nhập: Hiện nút login/register, ẩn userMenu
        if (loginBtn) loginBtn.classList.remove("d-none");
        if (registerBtn) registerBtn.classList.remove("d-none");
        if (userMenu) userMenu.classList.add("d-none");

        closeUserDropdown();
    }
}

// LOGOUT
function setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();

        if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/pages/index.html";
    });
}

// AVATAR DROPDOWN
function setupAvatarDropdown() {
    const avatarBtn = document.getElementById("avatarBtn");
    const userDropdown = document.getElementById("userDropdown");

    if (!avatarBtn || !userDropdown) return;

    avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleUserDropdown();
    });

    document.addEventListener("click", (e) => {
        if (!avatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            closeUserDropdown();
        }
    });
}

function toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) return;

    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function closeUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) dropdown.style.display = "none";
}
// ================== TOAST NOTIFICATIONS (FLASH MESSAGES) ==================
/**
 * Hiển thị thông báo kiểu Flash Message
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung tóm tắt
 * @param {string} type - success | error | warning | info
 * @param {number} duration - Thời gian hiển thị (ms)
 */
window.showToast = function(title, message = "", type = "success", duration = 5000) {
    const container = document.getElementById("toast-container");
    if (!container) {
        console.warn("Toast container not found!");
        // Fallback to alert if container is missing
        alert(`${title}: ${message}`);
        return;
    }

    const icons = {
        success: "fa-solid fa-circle-check",
        error: "fa-solid fa-circle-xmark",
        warning: "fa-solid fa-triangle-exclamation",
        info: "fa-solid fa-circle-info"
    };

    const toast = document.createElement("div");
    toast.className = `toast-message toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            ${message ? `<div class="toast-body">${message}</div>` : ""}
        </div>
        <button class="toast-close" title="Đóng">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    // Đóng bằng nút X
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        removeToast(toast);
    };

    // Tự động đóng sau n giây
    const timer = setTimeout(() => {
        removeToast(toast);
    }, duration);

    // Dừng timer nếu hover vào (giống Krayin/Admin dashboard)
    toast.onmouseenter = () => clearTimeout(timer);
    toast.onmouseleave = () => {
        setTimeout(() => removeToast(toast), 2000); // Đợi thêm 2s khi rời chuột
    };
};

function removeToast(toast) {
    if (toast.classList.contains("closing")) return;
    toast.classList.add("closing");
    toast.addEventListener("animationend", () => {
        toast.remove();
    });
}
