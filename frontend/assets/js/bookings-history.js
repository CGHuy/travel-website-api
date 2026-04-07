// Logic for Booking History page
document.addEventListener("DOMContentLoaded", async () => {
    // Load components
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html")
    ]);

    initBookingPage();
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

function initBookingPage() {
    console.log("Booking History page initialized");

    // Filter Tabs Interaction
    const filterTabs = document.querySelectorAll(".filter-tab");
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active from all
            filterTabs.forEach(t => t.classList.remove("active"));
            // Add to clicked
            tab.classList.add("active");

            // Filter logic (Mock)
            const status = tab.dataset.status;
            filterBookings(status);
        });
    });

    // Search Interaction (Mock)
    const searchInput = document.querySelector(".search-booking-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            console.log("Searching for:", query);
            // Implement real filtering here
        });
    }
}

function filterBookings(status) {
    console.log("Filtering bookings by:", status);
    // In a real app, you would fetch from API or filter local list
}
