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
    } catch (err) {
        console.error(`Failed to load component ${filePath}:`, err);
    }
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
