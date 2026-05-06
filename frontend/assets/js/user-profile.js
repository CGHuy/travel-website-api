// Logic for User Profile page
document.addEventListener("DOMContentLoaded", async () => {
    // Load components
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html"),
    ]);

    initSidebarActiveState();
    initChangePasswordForm();
    await loadProfile();
    initInlineEdit();
});

// ─── Load Component ─────────────────────────────────────────────────────────
async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;
    try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        target.innerHTML = await res.text();
        target.querySelectorAll("script").forEach((script) => {
            const newScript = document.createElement("script");
            newScript.src ? (newScript.src = script.src) : (newScript.textContent = script.textContent);
            document.body.appendChild(newScript);
            script.remove();
        });
        if (targetId === "side-placeholder") initSidebarActiveState();
    } catch (err) {
        console.error(`Failed to load component ${filePath}:`, err);
    }
}

// ─── Sidebar Active State ────────────────────────────────────────────────────
function initSidebarActiveState() {
    const currentPath = window.location.pathname;
    document.querySelectorAll(".user-nav-menu .nav-link").forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("active", currentPath.includes(href));
    });
}

// ─── Load Profile từ API ─────────────────────────────────────────────────────
async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../../pages/auth/login.html";
        return;
    }

    try {
        const res = await fetch("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const u = data.data;
        setFieldText("field-name", u.fullname);
        setFieldText("field-email", u.email);
        setFieldText("field-phone", u.phone);
        setFieldText("field-address", u.address || "--");
    } catch (err) {
        console.error("Lỗi khi tải thông tin profile:", err);
    }
}

function setFieldText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "--";
}

// ─── Inline Edit Logic ───────────────────────────────────────────────────────
// Lưu các giá trị gốc để hủy
let originalValues = {};
// Đếm số field đang edit
let editingCount = 0;

function initInlineEdit() {
    const saveBtnWrapper = document.getElementById("save-btn-wrapper");
    const saveBtn = document.getElementById("btn-save-profile");
    const cancelBtn = document.getElementById("btn-cancel-profile");

    document.querySelectorAll(".profile-field-edit").forEach((editIcon) => {
        if (!editIcon.querySelector("i")) return; // bỏ qua icon trống (email)

        editIcon.addEventListener("click", function () {
            const row = this.closest(".profile-field-row");
            const valueEl = row.querySelector(".profile-field-value");
            const fieldId = valueEl.id;

            // Nếu đang edit rồi thì bấm lại để hủy field đó
            if (this.classList.contains("active")) {
                cancelField(row, valueEl, this);
                editingCount = Math.max(0, editingCount - 1);
                if (editingCount === 0) saveBtnWrapper.style.display = "none";
                return;
            }

            // Lưu giá trị gốc
            originalValues[fieldId] = valueEl.textContent;

            // Tạo input inline
            const input = document.createElement("input");
            input.type = "text";
            input.className = "profile-inline-input";
            input.value = valueEl.textContent === "--" ? "" : valueEl.textContent;
            input.setAttribute("data-field-id", fieldId);

            valueEl.textContent = "";
            valueEl.appendChild(input);
            input.focus();

            // Đổi icon bút → X (đỏ)
            this.classList.add("active");
            this.innerHTML = '<i class="fa-solid fa-xmark"></i>';

            editingCount++;
            saveBtnWrapper.style.display = "block";
        });
    });

    // ── Nút Lưu ──
    saveBtn.addEventListener("click", async () => {
        await saveProfile();
    });

    // ── Nút Hủy ──
    cancelBtn.addEventListener("click", () => {
        cancelAllEdits();
        saveBtnWrapper.style.display = "none";
        editingCount = 0;
    });
}

function cancelField(row, valueEl, editIcon) {
    const fieldId = valueEl.id;
    const input = valueEl.querySelector("input");
    if (input) {
        valueEl.textContent = originalValues[fieldId] || "--";
    }
    editIcon.classList.remove("active");
    editIcon.innerHTML = '<i class="fa-solid fa-pencil"></i>';
    delete originalValues[fieldId];
}

function cancelAllEdits() {
    document.querySelectorAll(".profile-field-edit.active").forEach((editIcon) => {
        const row = editIcon.closest(".profile-field-row");
        const valueEl = row.querySelector(".profile-field-value");
        cancelField(row, valueEl, editIcon);
    });
}

// ─── Gọi API cập nhật profile ────────────────────────────────────────────────
async function saveProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Thu thập dữ liệu từ các input đang mở
    const payload = {};
    const fieldMap = {
        "field-name": "fullname",
        "field-phone": "phone",
        "field-address": "address",
    };

    // Lấy tất cả giá trị hiện tại (kể cả chưa edit)
    for (const [fieldId, apiKey] of Object.entries(fieldMap)) {
        const el = document.getElementById(fieldId);
        if (!el) continue;
        const input = el.querySelector("input");
        payload[apiKey] = input ? input.value.trim() : el.textContent.trim();
        if (payload[apiKey] === "--") payload[apiKey] = "";
    }

    // Email luôn lấy từ text (không cho sửa)
    const emailEl = document.getElementById("field-email");
    if (emailEl) payload.email = emailEl.textContent.trim();

    const saveBtn = document.getElementById("btn-save-profile");
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang lưu...';

    try {
        const res = await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        // Cập nhật UI: thay input → text mới
        for (const [fieldId] of Object.entries(fieldMap)) {
            const el = document.getElementById(fieldId);
            if (!el) continue;
            const input = el.querySelector("input");
            const newVal = input ? input.value.trim() || "--" : el.textContent;
            el.textContent = newVal;
        }

        // Reset tất cả icon về bút
        document.querySelectorAll(".profile-field-edit.active").forEach((icon) => {
            icon.classList.remove("active");
            icon.innerHTML = '<i class="fa-solid fa-pencil"></i>';
        });

        document.getElementById("save-btn-wrapper").style.display = "none";
        editingCount = 0;
        originalValues = {};

        window.showToast("Cập nhật thông tin thành công!", "success");
    } catch (err) {
        console.error("Lỗi khi lưu profile:", err);
        window.showToast(err.message || "Lỗi khi cập nhật. Vui lòng thử lại!", "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i>Lưu thay đổi';
    }
}

// ─── Change Password Form ────────────────────────────────────────────────────
function initChangePasswordForm() {
    const form = document.getElementById("change-password-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            window.showToast("Mật khẩu mới và xác nhận không khớp!", "danger");
            return;
        }
        if (newPassword.length < 6) {
            window.showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "danger");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/users/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || data.errors?.confirmPassword || "Lỗi khi đổi mật khẩu");
            
            // Lưu token mới nếu backend trả về
            if (data.data?.token) {
                localStorage.setItem("token", data.data.token);
            }
            
            window.showToast("Đổi mật khẩu thành công!", "success");
            form.reset();
        } catch (err) {
            window.showToast(err.message || "Lỗi khi đổi mật khẩu!", "danger");
        }
    });
}
