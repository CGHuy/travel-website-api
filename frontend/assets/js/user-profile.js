// Logic for User Profile page
document.addEventListener("DOMContentLoaded", async () => {
    // Load components
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html")
    ]);

    // Initialize page logic
    initProfilePage();
    initSidebarActiveState();
    initChangePasswordForm();
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

    // Handle static items as well if they match
    const staticLinks = document.querySelectorAll(".nav-item-static a");
    staticLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.style.color = "#e74c3c";
            link.querySelector("span").style.fontWeight = "600";
        }
    });
}

function initChangePasswordForm() {
    const form = document.getElementById("change-password-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Validation
        if (newPassword !== confirmPassword) {
            alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        if (newPassword.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        try {
            // Assume API endpoint exists based on backend research
            // const token = localStorage.getItem("token");
            // const response = await fetch("/api/users/change-password", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         "Authorization": `Bearer ${token}`
            //     },
            //     body: JSON.stringify({ currentPassword, newPassword })
            // });
            // const result = await response.json();

            // Mock success for demonstration
            console.log("Submitting change password:", { currentPassword, newPassword });
            alert("Đổi mật khẩu thành công!");
            form.reset();
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
        }
    });
}

function initProfilePage() {
    console.log("Profile page initialized");
    
    // Handle Logout button in sidebar (if it exists)
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // Implement logout logic here
            alert("Đang đăng xuất...");
            // window.location.href = "../../login.html";
        });
    }

    // Handle Edit icons
    const editIcons = document.querySelectorAll(".profile-field-edit");
    editIcons.forEach(icon => {
        icon.addEventListener("click", function() {
            const row = this.closest(".profile-field-row");
            const label = row.querySelector(".profile-field-label").textContent;
            const valueEl = row.querySelector(".profile-field-value");
            const currentValue = valueEl.textContent;

            // Simple prompt for editing (can be replaced with modals/inline inputs)
            const newValue = prompt(`Chỉnh sửa ${label}:`, currentValue);
            if (newValue !== null && newValue !== currentValue) {
                valueEl.textContent = newValue;
                // Here you would normally call an API to save the change
                console.log(`Updated ${label} to ${newValue}`);
            }
        });
    });
}
