document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([loadComponent("header-placeholder", "../../components/header.html"), loadComponent("footer-placeholder", "../../components/footer.html")]);
    initAdminLayout();
});

function initAdminLayout() {
    const menuItems = document.querySelectorAll(".menu-item[data-page][data-file]");
    if (menuItems.length === 0) return;

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
        try {
            const res = await fetch(`./${filePath}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            contentEl.innerHTML = await res.text();

            if (filePath === "tour.html" && typeof window.initAdminTourPage === "function") {
                await window.initAdminTourPage();
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
