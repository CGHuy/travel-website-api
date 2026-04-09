// Khởi tạo header
function initHeader() {
    updateAuthUI();
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

// ================== AUTH UI ==================
function updateAuthUI() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");
    const adminMenu = document.getElementById("adminMenu");

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

            if (adminMenu) {
                const canAccessAdmin = hasAdminAccess(userData);
                adminMenu.classList.toggle("d-none", !canAccessAdmin);
            }

            if (avatarImg) {
                avatarImg.alt = userData.fullname;
            }

            if (userName) {
                userName.textContent = `Hi! ${userData.fullname}`;
            }
        } catch (err) {
            console.error("Không đọc được dữ liệu user:", err);
            if (adminMenu) adminMenu.classList.add("d-none");
        }
    } else {
        // Chưa đăng nhập: Hiện nút login/register, ẩn userMenu
        if (loginBtn) loginBtn.classList.remove("d-none");
        if (registerBtn) registerBtn.classList.remove("d-none");
        if (userMenu) userMenu.classList.add("d-none");
        if (adminMenu) adminMenu.classList.add("d-none");

        closeUserDropdown();
    }
}

function hasAdminAccess(userData) {
    if (!userData || typeof userData !== "object") return false;

    const isTruthyRole = (value) => value === true || value === "true" || value === 1 || value === "1";
    const normalizedRole = typeof userData.role === "string" ? userData.role.trim().toLowerCase() : "";

    const hasRoleByName = ["admin", "booking-staff", "tour-staff"].includes(normalizedRole);

    return hasRoleByName || isTruthyRole(userData.isAdmin) || isTruthyRole(userData.isBookingStaff) || isTruthyRole(userData.isTourStaff);
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
window.showToast = function (title, message = "", type = "success", duration = 5000) {
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
        info: "fa-solid fa-circle-info",
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
