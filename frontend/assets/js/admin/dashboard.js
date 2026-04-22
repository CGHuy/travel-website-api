const loadedFragmentScriptSrcs = new Set();
const CONTENT_LOADING_HTML = `
    <div class="d-flex justify-content-center align-items-center" style="min-height: 300px;">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status text-primary">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`;

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([loadComponent("header-placeholder", "../../components/header.html"), loadComponent("footer-placeholder", "../../components/footer.html")]);
    initAdminLayout();
});

function initAdminLayout() {
    const menuItems = Array.from(document.querySelectorAll(".menu-item[data-page][data-file]"));
    if (menuItems.length === 0) return;

    initSidebar();

    menuItems.forEach((item) => {
        const link = item.querySelector("a");
        if (!link) return;

        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = item.getAttribute("data-page");
            history.pushState({ page }, "", `${window.location.pathname}?page=${page}`);
            setActiveMenu(page, menuItems);
        });
    });

    window.addEventListener("popstate", () => {
        const page = getCurrentPageQuery();
        if (page) setActiveMenu(page, menuItems);
    });

    const initialPage = getCurrentPageQuery();
    if (!initialPage) {
        clearActiveMenu(menuItems);
        clearContent();
        return;
    }
    setActiveMenu(initialPage, menuItems);
}

function initSidebar() {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const adminShell = document.querySelector(".admin-shell");
    if (!sidebarToggle || !adminShell) return;

    if (localStorage.getItem("admin-sidebar-collapsed") === "true") {
        adminShell.classList.add("collapsed-sidebar");
    }

    sidebarToggle.addEventListener("click", () => {
        adminShell.classList.toggle("collapsed-sidebar");
        localStorage.setItem("admin-sidebar-collapsed", adminShell.classList.contains("collapsed-sidebar"));
        setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
    });
}

async function setActiveMenu(page, menuItems) {
    const activeItem = menuItems.find((item) => item.getAttribute("data-page") === page);
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
    if (!contentEl) return;

    contentEl.className = "";
    contentEl.innerHTML = CONTENT_LOADING_HTML;

    try {
        await runPageTeardown();

        const res = await fetch(`/pages/admin/${filePath}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        contentEl.innerHTML = await res.text();
        await executeFragmentScripts(contentEl);
        await runPageInitializer(page);
    } catch (error) {
        contentEl.innerHTML = `<div class="alert alert-warning">Chưa có file <strong>${filePath}</strong> hoặc không thể tải nội dung.</div>`;
        console.error("Không thể tải nội dung file:", error);
    }
}

async function executeFragmentScripts(containerEl) {
    const scriptElements = Array.from(containerEl.querySelectorAll("script"));
    const scriptLoadPromises = scriptElements.map((script) => {
        const newScript = document.createElement("script");
        if (script.type) newScript.type = script.type;

        if (script.src) {
            const resolvedSrc = script.src;
            if (loadedFragmentScriptSrcs.has(resolvedSrc)) return Promise.resolve();

            newScript.src = resolvedSrc;
            loadedFragmentScriptSrcs.add(resolvedSrc);

            return new Promise((resolve, reject) => {
                newScript.onload = resolve;
                newScript.onerror = () => {
                    loadedFragmentScriptSrcs.delete(resolvedSrc);
                    reject(new Error(`Không thể tải script: ${resolvedSrc}`));
                };
                document.body.appendChild(newScript);
            });
        }

        newScript.textContent = script.textContent;
        document.body.appendChild(newScript);
        return Promise.resolve();
    });

    await Promise.all(scriptLoadPromises);
    scriptElements.forEach((script) => script.remove());
}

async function runPageInitializer(page) {
    const camelCaseStr = page
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
    const initFunctionName = `initAdmin${camelCaseStr}Page`;

    if (typeof window[initFunctionName] === "function") {
        await window[initFunctionName]();
        return;
    }

    if (typeof window.initAdminPage === "function") {
        await window.initAdminPage();
        window.initAdminPage = null;
    }
}

async function runPageTeardown() {
    if (typeof window.cleanupCurrentAdminPage === "function") {
        await window.cleanupCurrentAdminPage();
        window.cleanupCurrentAdminPage = null;
    }
}

function clearActiveMenu(menuItems) {
    menuItems.forEach((item) => item.classList.remove("active"));
}

function clearContent() {
    const contentEl = document.getElementById("admin-content");
    if (!contentEl) return;
    contentEl.className = "";
    contentEl.innerHTML = "";
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

        if (!filePath.includes("header.html")) return;

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
    } catch (err) {
        console.error("Không thể tải component:", err);
    }
}
