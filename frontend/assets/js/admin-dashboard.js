document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([loadComponent("header-placeholder", "../../components/header.html"), loadComponent("footer-placeholder", "../../components/footer.html")]);
    initAdminLayout();
});

function initAdminLayout() {
    const menuItems = document.querySelectorAll(".menu-item[data-page][data-file]");
    if (menuItems.length === 0) return;

    // Logic thu gọn sidebar
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const adminShell = document.querySelector(".admin-shell");
    
    if (sidebarToggle && adminShell) {
        if (localStorage.getItem("admin-sidebar-collapsed") === "true") {
            adminShell.classList.add("collapsed-sidebar");
        }

        sidebarToggle.addEventListener("click", () => {
            adminShell.classList.toggle("collapsed-sidebar");
            const isCollapsed = adminShell.classList.contains("collapsed-sidebar");
            localStorage.setItem("admin-sidebar-collapsed", isCollapsed);
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
        });
    }

    // --- MỚI: Xử lý Click để chuyển tab không load lại trang (SPA) ---
    menuItems.forEach(item => {
        const link = item.querySelector("a");
        if (!link) return;

        link.addEventListener("click", (e) => {
            e.preventDefault(); // Ngăn trình duyệt load lại trang
            
            const page = item.getAttribute("data-page");
            const newUrl = `${window.location.pathname}?page=${page}`;
            
            // Cập nhật URL trên thanh địa chỉ mà không load lại
            history.pushState({ page }, "", newUrl);
            
            // Cập nhật nội dung ngay lập tức
            setActiveMenu(page, menuItems);
        });
    });

    // Xử lý khi nhấn nút Back/Forward của trình duyệt
    window.addEventListener("popstate", (e) => {
        const page = getCurrentPageQuery();
        if (page) setActiveMenu(page, menuItems);
    });

    const initialPage = getCurrentPageQuery();
    if (initialPage) {
        setActiveMenu(initialPage, menuItems);
    } else {
        clearActiveMenu(menuItems);
        clearContent();
    }
}

async function setActiveMenu(page, menuItems) {
    const activeItem = Array.from(menuItems).find((item) => item.getAttribute("data-page") === page);
    if (!activeItem) {
        clearActiveMenu(menuItems);
        clearContent();
        return;
    }

    const filePath = activeItem.getAttribute("data-file");
    if (!filePath) return;

    menuItems.forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-file") === filePath);
    });

    const contentEl = document.getElementById("admin-content");

    if (contentEl) {
        contentEl.className = "";
        // Hiện hiệu ứng loading ngay lập tức để người dùng biết tab đang chuyển
        contentEl.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 300px;">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status text-primary">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>`;

        try {
            const res = await fetch(`./${filePath}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            contentEl.innerHTML = await res.text();

            // Convention: "booking" -> initAdminBookingPage()
            // "tour-service" -> initAdminTourServicePage()
            const camelCaseStr = page.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
            const initFunctionName = `initAdmin${camelCaseStr}Page`;

            if (typeof window[initFunctionName] === "function") {
                await window[initFunctionName]();
            } else if (typeof window.initAdminPage === "function") {
                // Fallback for older inline scripts (if any remain)
                await window.initAdminPage();
                window.initAdminPage = null; 
            }
        } catch (error) {
            contentEl.innerHTML = `<div class="alert alert-warning">Chưa có file <strong>${filePath}</strong> hoặc không thể tải nội dung.</div>`;
            console.error("Không thể tải nội dung file:", error);
        }
    }
}

function clearActiveMenu(menuItems) {
    menuItems.forEach((item) => item.classList.remove("active"));
}

function clearContent() {
    const contentEl = document.getElementById("admin-content");
    if (contentEl) {
        contentEl.className = "";
        contentEl.innerHTML = "";
    }
}

function getCurrentPageQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("page");
}

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
    } catch (err) {
        console.error("Không thể tải component:", err);
    }
}
