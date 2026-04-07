// Logic for Favorite Tours page
document.addEventListener("DOMContentLoaded", async () => {
    // Load components
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html")
    ]);

    initFavoritePage();
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

function initFavoritePage() {
    console.log("Favorite page initialized");

    // Remove from favorites logic with animation
    const removeBtns = document.querySelectorAll(".remove-favorite-btn");
    removeBtns.forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            const card = this.closest(".favorite-card");
            if (confirm("Bạn có muốn xóa tour này khỏi danh sách yêu thích?")) {
                card.classList.add("animate__animated", "animate__fadeOutLeft");
                
                card.addEventListener("animationend", () => {
                    card.remove();
                    checkEmptyState();
                }, { once: true });
            }
        });
    });

    // Search Filtering
    const searchInput = document.getElementById("searchFavorite");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const query = this.value.trim().toLowerCase();
            const cards = document.querySelectorAll(".favorite-card");
            let visibleCount = 0;

            cards.forEach(card => {
                const name = card.querySelector(".favorite-tour-name").textContent.toLowerCase();
                if (name.includes(query)) {
                    card.classList.remove("d-none");
                    visibleCount++;
                } else {
                    card.classList.add("d-none");
                }
            });

            const noFavorites = document.getElementById("no-favorites");
            const listContainer = document.getElementById("favorite-list");
            
            if (visibleCount === 0) {
                noFavorites.classList.remove("d-none");
                noFavorites.querySelector("h5").textContent = "Không tìm thấy kết quả phù hợp!";
                listContainer.classList.add("d-none");
            } else {
                noFavorites.classList.add("d-none");
                listContainer.classList.remove("d-none");
            }
        });
    }
}

function checkEmptyState() {
    const cards = document.querySelectorAll(".favorite-card");
    if (cards.length === 0) {
        const noFavorites = document.getElementById("no-favorites");
        noFavorites.classList.remove("d-none");
        noFavorites.querySelector("h5").textContent = "Hiện tại bạn chưa lưu tour nào!";
        document.getElementById("favorite-list").classList.add("d-none");
    }
}
