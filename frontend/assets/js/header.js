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
        
        // Ẩn mục lịch sử và yêu thích đối với staff/admin
        const navHistory = document.getElementById("navHistory");
        const navFavorites = document.getElementById("navFavorites");
        if (navHistory) navHistory.parentElement.classList.add("d-none");
        if (navFavorites) navFavorites.parentElement.classList.add("d-none");
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
        window.showConfirm("Bạn có chắc chắn muốn đăng xuất?", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/pages/index.html";
        });
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

// ================== GLOBAL UI UTILITIES (MODALS & TOASTS) ==================

/**
 * Global Confirm Dialog
 * @param {string} message 
 * @param {function} onConfirm 
 */
window.showConfirm = function(message, onConfirm) {
    const modalEl = document.getElementById('globalConfirmModal');
    if (!modalEl) {
        if (confirm(message)) onConfirm();
        return;
    }

    const modal = new bootstrap.Modal(modalEl);
    document.getElementById('globalConfirmMessage').innerHTML = message;
    
    const submitBtn = document.getElementById('globalConfirmSubmit');
    // Clear old listeners
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    newSubmitBtn.addEventListener('click', () => {
        onConfirm();
        modal.hide();
    });
    
    modal.show();
};

/**
 * Global Toast Notification (Bootstrap version)
 * @param {string} message 
 * @param {string} type - success | danger | warning | info
 */
window.showToast = function(message, type = "success") {
    const toastEl = document.getElementById('globalToast');
    const toastBody = document.getElementById('globalToastBody');
    if (!toastEl || !toastBody) {
        alert(message);
        return;
    }

    toastBody.textContent = message;
    
    // Set color based on type
    toastEl.className = `toast align-items-center border-0 text-white bg-${type === 'error' ? 'danger' : type}`;
    
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
};

/**
 * Alias for showToast for backward compatibility or general alerts
 */
window.showAlert = function(message, type = "info") {
    window.showToast(message, type);
};
