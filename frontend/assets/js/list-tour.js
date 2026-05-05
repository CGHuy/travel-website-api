// Main logic to fetch and render tours for list-tour page
document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"), 
        loadComponent("footer-placeholder", "../../components/footer.html")
    ]);

    // DOM Elements
    const priceRange = document.getElementById("priceRange");
    const priceMin = document.getElementById("priceMin");
    const tourListContainer = document.getElementById("tour-list");
    const searchInput = document.getElementById("searchInput");
    const regionSelect = document.getElementById("regionSelect");
    const sortSelect = document.getElementById("sort");
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const serviceFilterContainer = document.getElementById("service-filter-container");
    const paginationContainer = document.getElementById("pagination-container");

    let currentFilters = {
        page: 1,
        limit: 6,
    };

    let priceFilterEnabled = false;
    let isAiMode = false; // Flag: đang hiển thị kết quả AI, chặn fetchTours ghi đè

    if (!tourListContainer) return;

    // Debounce function to limit API calls during rapid input
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Phase 1: Fetch and Render Services for Filter Sidebar
    const fetchServices = async () => {
        try {
            const response = await fetch("/api/list-tours/services");
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                renderServiceFilters(result.data);
            } else {
                serviceFilterContainer.innerHTML = '<div class="text-muted small">Không có dịch vụ</div>';
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            serviceFilterContainer.innerHTML = '<div class="text-danger small">Lỗi tải dịch vụ</div>';
        }
    };

    const renderServiceFilters = (services) => {
        serviceFilterContainer.innerHTML = services
            .map(
                (service) => `
            <div class="form-check custom-checkbox">
                <input class="form-check-input rounded border-secondary service-checkbox auto-filter" type="checkbox" id="svc${service.id}" value="${service.id}">
                <label class="form-check-label fw-medium text-secondary" for="svc${service.id}">${service.name}</label>
            </div>
        `,
            )
            .join("");

        // Add listeners to newly created service checkboxes
        document.querySelectorAll(".service-checkbox").forEach((cb) => {
            cb.addEventListener("change", () => fetchTours(1));
        });
    };

    // Phase 2: Fetch and Render Tours
    const fetchTours = async (page = 1) => {
        if (isAiMode) return; // Đang ở chế độ AI, không fetch tours thông thường
        currentFilters.page = page;

        // Show loading state
        tourListContainer.innerHTML = `
            <div class="text-center py-5 w-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted fw-medium">Đang tìm kiếm tour phù hợp...</p>
            </div>
        `;

        // Collect filter values
        const params = new URLSearchParams();
        params.append("page", currentFilters.page);
        params.append("limit", currentFilters.limit);

        if (searchInput && searchInput.value) params.append("search", searchInput.value);
        if (priceFilterEnabled && priceRange && priceRange.value) params.append("max_price", priceRange.value);
        if (regionSelect && regionSelect.value) params.append("region", regionSelect.value);
        if (sortSelect && sortSelect.value) params.append("sort", sortSelect.value);

        // Get selected duration
        const selectedDuration = document.querySelector('input[name="duration"]:checked');
        if (selectedDuration && selectedDuration.id !== "dur_all") {
            params.append("duration", selectedDuration.id);
        }

        // Get selected services
        const selectedServices = Array.from(document.querySelectorAll(".service-checkbox:checked")).map((cb) => cb.value);
        if (selectedServices.length > 0) params.append("services", selectedServices.join(","));

        try {
            const response = await fetch(`/api/list-tours?${params.toString()}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                // If logged in, fetch user's wishlist to mark icons
                const token = localStorage.getItem("token");
                let wishlistTourIds = [];
                if (token) {
                    try {
                        const wishlistRes = await fetch("/api/list-tours/wishlist/all", {
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                        const wishlistData = await wishlistRes.json();
                        if (wishlistData.success) {
                            wishlistTourIds = wishlistData.data.map(item => item.tour_id);
                        }
                    } catch (e) {
                        console.error("Error fetching wishlist for marking:", e);
                    }
                }

                renderTours(result.data, wishlistTourIds);
                renderPagination(result.pagination);
            } else {
                tourListContainer.innerHTML = `
                    <div class="text-center py-5 bg-white rounded-4 shadow-sm border border-light w-100">
                        <img src="https://illustrations.popsy.co/amber/no-results.svg" style="width: 200px; opacity: 0.8;" alt="No results">
                        <h4 class="fw-bold text-dark mt-4">Không tìm thấy tour nào</h4>
                        <p class="text-muted mx-auto" style="max-width: 400px;">Rất tiếc, chúng tôi không tìm thấy kết quả phù hợp với tiêu chí của bạn. Vui lòng thử lại với bộ lọc khác.</p>
                        <button class="btn btn-outline-primary rounded-pill px-4 mt-2" onclick="clearFilters()">Xóa tất cả bộ lọc</button>
                    </div>
                `;
                paginationContainer.innerHTML = "";
            }
        } catch (error) {
            console.error("Error fetching tours:", error);
            tourListContainer.innerHTML = '<div class="alert alert-danger w-100">Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</div>';
        }
    };

    const renderTours = (tours, wishlistTourIds) => {
        tourListContainer.innerHTML = tours
            .map(
                (tour) => {
                    const isInWishlist = wishlistTourIds.includes(tour.id);
                    const departureLocations = Array.isArray(tour.departure_locations)
                        ? tour.departure_locations.filter(Boolean).slice(0, 3)
                        : [];
                    const departureLocationHtml = departureLocations.length > 0
                        ? departureLocations
                            .map(
                                (location) => `
                                    <span class="badge rounded-pill border border-primary-subtle text-primary-emphasis bg-primary-subtle">${location}</span>
                                `,
                            )
                            .join("")
                        : `<span class="text-primary fw-medium">${tour.location || "Liên hệ"}</span>`;

                    return `
            <div class="card border border-light shadow-sm overflow-hidden bg-white tour-horizontal-card mb-4" onclick="window.location.href='/detail-tour?id=${tour.id}'">
                <div class="row g-0 flex-column flex-md-row h-100">
                    <div class="col-md-5 col-xl-4 position-relative h-100">
                        <img src="${tour.cover_image || "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070"}" class="img-fluid w-100 h-100 object-fit-cover" style="min-height: 260px;" alt="${tour.name}">
                        <button class="position-absolute top-0 start-0 m-3 p-0 bg-transparent border-0 fs-3 d-flex align-items-center justify-content-center" 
                                style="text-shadow: 0 2px 4px rgba(0,0,0,0.6); color: ${isInWishlist ? '#ef4444' : 'white'}; cursor: pointer; width: 40px; height: 40px; z-index: 10;" 
                                onclick="addToWishlist(${tour.id}, event)">
                            <i class="fa-solid fa-heart ${isInWishlist ? '' : 'opacity-75'}"></i>
                        </button>
                        ${
                            tour.price_default > 10000000
                                ? `
                        <span class="badge bg-danger position-absolute bottom-0 start-0 m-3 px-3 py-2 fs-6 rounded-1">
                            <i class="fa-regular fa-gem me-1"></i> Cao cấp
                        </span>`
                                : ""
                        }
                    </div>
                    <div class="col-md-7 col-xl-8">
                        <div class="card-body p-4 pt-3 pb-3 d-flex flex-column h-100">
                            <h4 class="card-title fw-bold mb-3 text-dark line-clamp-2" style="font-size: 1.25rem; line-height: 1.4;">
                                ${tour.name}
                            </h4>
                            
                            <div class="row g-2 mb-3 text-dark" style="font-size: 0.9rem;">
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-ticket text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Mã tour:</span> 
                                    <span class="fw-bold">TOUR${tour.id.toString().padStart(3, "0")}</span>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-location-dot text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Khởi hành:</span> 
                                    <div class="d-flex align-items-center flex-wrap gap-1">${departureLocationHtml}</div>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-regular fa-clock text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Thời gian:</span> 
                                    <span class="fw-bold">${tour.duration}</span>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-map-marked-alt text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Khu vực:</span> 
                                    <span class="fw-medium">${tour.region}</span>
                                </div>
                            </div>

                            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-light flex-wrap">
                                <i class="fa-regular fa-calendar-days text-muted"></i>
                                <span class="fw-medium text-dark text-nowrap">Ngày khởi hành:</span>
                                <div class="d-flex gap-2 flex-nowrap overflow-hidden ms-2">
                                    ${(tour.upcoming_dates || "Liên hệ")
                                        .split(",")
                                        .map(
                                            (date) => `
                                        <span class="border border-danger text-danger px-2 py-1 rounded bg-white" style="font-size: 0.8rem; cursor: pointer;" onclick="event.stopPropagation()">${date}</span>
                                    `,
                                        )
                                        .join("")}
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-end mt-auto pt-1">
                                <div>
                                    <span class="text-dark d-block mb-1" style="font-size: 0.9rem;">Giá từ:</span>
                                    <span class="fw-bold text-danger" style="font-size: 1.5rem;">${parseInt(tour.price_default).toLocaleString("vi-VN")} <span class="text-decoration-underline" style="font-size: 1.2rem;">đ</span></span>
                                </div>
                                <a href="/detail-tour?id=${tour.id}" class="btn btn-primary px-4 shadow-sm rounded-2" style="font-weight: 500; font-size: 0.95rem; padding-top: 8px; padding-bottom: 8px; background-color: #0b5ed7;">Xem chi tiết</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
                }
            )
            .join("");
    };

    const renderPagination = (pagination) => {
        const { currentPage, totalPages } = pagination;
        if (totalPages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }
        let html = "";

        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                <a class="page-link border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center ${currentPage === 1 ? "text-muted" : "text-dark"}" 
                   href="javascript:void(0)" onclick="changePage(${currentPage - 1})" style="width: 45px; height: 45px;">
                    <i class="fa-solid fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${currentPage === i ? "active" : ""}">
                    <a class="page-link border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center fw-bold fs-6 ${currentPage === i ? "" : "text-dark"}" 
                       href="javascript:void(0)" onclick="changePage(${i})" style="width: 45px; height: 45px;">
                        ${i}
                    </a>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                <a class="page-link border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center ${currentPage === totalPages ? "text-muted" : "text-dark"}" 
                   href="javascript:void(0)" onclick="changePage(${currentPage + 1})" style="width: 45px; height: 45px;">
                    <i class="fa-solid fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = html;
    };

    // Global helper functions
    window.changePage = (page) => {
        fetchTours(page);
        window.scrollTo({ top: document.querySelector(".main-container").offsetTop - 100, behavior: "smooth" });
    };

    window.addToWishlist = async (tourId, event) => {
        event.stopPropagation();
        
        const token = localStorage.getItem("token");
        if (!token) {
            showToast("Thông báo", "Vui lòng đăng nhập để thực hiện thao tác này!", "warning");
            setTimeout(() => {
                window.location.href = `/pages/auth/login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }, 2000);
            return;
        }

        const btn = event.currentTarget;
        const icon = btn.querySelector("i");
        // Kiểm tra trạng thái hiện tại qua màu sắc hoặc class (ở bản này ta dùng màu sắc inline style hoặc opacity)
        const isCurrentlyLiked = btn.style.color === 'rgb(239, 68, 68)' || btn.style.color === '#ef4444';

        try {
            const method = isCurrentlyLiked ? "DELETE" : "POST";
            const response = await fetch(`/api/list-tours/wishlist/${tourId}`, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (result.success) {
                if (isCurrentlyLiked) {
                    // Xóa thành công
                    btn.style.color = "white";
                    icon.classList.add("opacity-75");
                    showToast("Thành công", "Đã xóa tour khỏi danh sách yêu thích!", "success");
                } else {
                    // Thêm thành công
                    btn.style.color = "#ef4444";
                    icon.classList.remove("opacity-75");
                    icon.classList.add("animate-heart");
                    showToast("Thành công", "Đã thêm tour vào danh sách yêu thích!", "success");
                }
            } else {
                showToast("Thông báo", result.message || "Đã có lỗi xảy ra.", "info");
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            showToast("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại sau.", "error");
        }
    };

    window.clearFilters = () => {
        if (searchInput) searchInput.value = "";
        if (priceRange) {
            priceRange.value = 10000000;
            priceMin.innerText = "10.000.000đ";
        }
        priceFilterEnabled = false;
        if (regionSelect) regionSelect.value = "";
        if (sortSelect) sortSelect.value = "";
        document.getElementById("dur_all").checked = true;
        document.querySelectorAll(".service-checkbox").forEach((cb) => (cb.checked = false));
        fetchTours(1);
    };

    // Event Listeners with Debounce and Auto-Trigger
    const debouncedFetch = debounce(() => fetchTours(1), 500);

    if (priceRange && priceMin) {
        priceRange.value = priceRange.max || 10000000;
        priceMin.innerText = parseInt(priceRange.value).toLocaleString("vi-VN") + "đ+";
        priceRange.addEventListener("input", function () {
            priceFilterEnabled = true;
            priceMin.innerText = parseInt(this.value).toLocaleString("vi-VN") + "đ";
            debouncedFetch();
        });
    }

    if (regionSelect) {
        regionSelect.addEventListener("change", () => fetchTours(1));
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", () => fetchTours(1));
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => debouncedFetch());
    }

    // Listen to duration radio buttons
    document.querySelectorAll('input[name="duration"]').forEach((radio) => {
        radio.addEventListener("change", () => fetchTours(1));
    });

    if (applyFilterBtn) {
        applyFilterBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Làm mới bộ lọc';
        applyFilterBtn.classList.replace("btn-primary", "btn-outline-secondary");
        applyFilterBtn.addEventListener("click", clearFilters);
    }

    // --- XỬ LÝ TÌM KIẾM BẰNG AI (FLOATING WIDGET) ---
    const aiFabBtn = document.getElementById("aiFabBtn");
    const aiChatPanel = document.getElementById("aiChatPanel");
    const closeAiPanelBtn = document.getElementById("closeAiPanelBtn");
    const chatMessages = document.getElementById("chatMessages");
    const aiSearchInput = document.getElementById("aiSearchInput");
    const btnAiSearch = document.getElementById("btnAiSearch");
    const exitAiModeBtn = document.getElementById("exitAiModeBtn");
    const exitAiModeBtnWrapper = document.getElementById("exitAiModeBtnWrapper");

    // Helper: cuộn chat xuống cuối
    const scrollChatToBottom = () => {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Helper: thêm bong bóng chat user
    const appendUserBubble = (text) => {
        const div = document.createElement("div");
        div.className = "d-flex justify-content-end";
        div.innerHTML = `
            <div class="text-white rounded-3 px-3 py-2 shadow-sm" style="background: linear-gradient(135deg, #0d6efd, #0dcaf0); max-width: 85%; font-size: 0.85rem; line-height: 1.5; border-bottom-right-radius: 4px !important;">
                ${text}
            </div>`;
        chatMessages.appendChild(div);
        scrollChatToBottom();
    };

    // Helper: thêm bong bóng loading AI
    const appendLoadingBubble = () => {
        const div = document.createElement("div");
        div.id = "aiLoadingBubble";
        div.className = "d-flex gap-2 align-items-end";
        div.innerHTML = `
            <div class="bg-primary text-white rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden" style="width: 30px; height: 30px; border: 1px solid #0d6efd;">
                <img src="https://res.cloudinary.com/dvnad2fcg/image/upload/v1777626275/logo_real_tnail6.png" alt="AI" style="width: 100%; height: 100%; object-fit: cover; transform: scale(1.6);" />
            </div>
            <div class="bg-white p-3 rounded-3 shadow-sm" style="border-top-left-radius: 4px !important; font-size: 0.85rem;">
                <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
                <span class="ms-2 text-muted">Đang tìm kiếm...</span>
            </div>`;
        chatMessages.appendChild(div);
        scrollChatToBottom();
    };

    // Helper: thay loading bubble bằng câu trả lời AI
    const replaceLoadingWithAiReply = (text) => {
        const loading = document.getElementById("aiLoadingBubble");
        if (loading) loading.remove();
        const div = document.createElement("div");
        div.className = "d-flex gap-2 align-items-end";
        div.innerHTML = `
            <div class="bg-primary text-white rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden" style="width: 30px; height: 30px; border: 1px solid #0d6efd;">
                <img src="https://res.cloudinary.com/dvnad2fcg/image/upload/v1777626275/logo_real_tnail6.png" alt="AI" style="width: 100%; height: 100%; object-fit: cover; transform: scale(1.6);" />
            </div>
            <div class="bg-white p-3 rounded-3 shadow-sm" style="border-top-left-radius: 4px !important; max-width: 85%; font-size: 0.85rem; line-height: 1.6;">
                ${text}
            </div>`;
        chatMessages.appendChild(div);
        scrollChatToBottom();
    };

    // Toggle Chat Panel
    if (aiFabBtn && aiChatPanel) {
        aiFabBtn.addEventListener("click", () => {
            aiChatPanel.classList.remove("d-none");
            aiFabBtn.classList.add("d-none"); // Ẩn nút icon khi mở chat
            aiSearchInput.focus();
            scrollChatToBottom();
        });
    }

    if (closeAiPanelBtn && aiChatPanel) {
        closeAiPanelBtn.addEventListener("click", () => {
            aiChatPanel.classList.add("d-none");
            aiFabBtn.classList.remove("d-none"); // Hiện lại nút icon khi đóng chat
        });
    }

    if (btnAiSearch && aiSearchInput) {
        const handleAiSearch = async () => {
            const message = aiSearchInput.value.trim();
            if (!message) return;

            // Append bong bóng người dùng + loading
            appendUserBubble(message);
            aiSearchInput.value = "";
            btnAiSearch.disabled = true;
            btnAiSearch.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
            appendLoadingBubble();

            // Loading state trên danh sách tour
            tourListContainer.innerHTML = `
                <div class="text-center py-5 w-100">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-3 text-muted fw-bold">AI đang tìm kiếm tour phù hợp...</p>
                </div>`;
            paginationContainer.innerHTML = "";

            try {
                const response = await fetch("/api/list-tours/suggestions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });
                const result = await response.json();

                if (result.success && result.data && result.data.length > 0) {
                    isAiMode = true;
                    replaceLoadingWithAiReply(result.message.replace(/\n/g, "<br>"));
                    if (exitAiModeBtnWrapper) exitAiModeBtnWrapper.classList.remove("d-none");

                    const token = localStorage.getItem("token");
                    let wishlistTourIds = [];
                    if (token) {
                        try {
                            const wishlistRes = await fetch("/api/list-tours/wishlist/all", {
                                headers: { "Authorization": `Bearer ${token}` }
                            });
                            const wishlistData = await wishlistRes.json();
                            if (wishlistData.success) wishlistTourIds = wishlistData.data.map(item => item.tour_id);
                        } catch (e) {}
                    }

                    renderTours(result.data, wishlistTourIds);
                    paginationContainer.innerHTML = "";
                    window.scrollTo({ top: document.querySelector(".main-container").offsetTop - 100, behavior: "smooth" });
                } else {
                    const msg = result.message || "Rất tiếc, mình không tìm thấy tour nào phù hợp. Bạn thử mô tả lại hoặc thay đổi ngân sách nhé!";
                    replaceLoadingWithAiReply(msg);
                    tourListContainer.innerHTML = `
                        <div class="text-center py-5 bg-white rounded-4 shadow-sm border border-light w-100">
                            <img src="https://illustrations.popsy.co/amber/no-results.svg" style="width: 180px; opacity: 0.8;" alt="No results">
                            <h5 class="fw-bold text-dark mt-4">Không tìm thấy tour nào</h5>
                        </div>`;
                }
            } catch (error) {
                console.error("Lỗi gọi AI:", error);
                replaceLoadingWithAiReply("⚠️ Đã xảy ra lỗi kết nối tới AI. Vui lòng đảm bảo Ollama đang chạy!");
                tourListContainer.innerHTML = "";
            } finally {
                btnAiSearch.disabled = false;
                btnAiSearch.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
            }
        };

        btnAiSearch.addEventListener("click", handleAiSearch);
        aiSearchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleAiSearch();
        });
    }

    // Nút thoát chế độ AI
    if (exitAiModeBtn) {
        exitAiModeBtn.addEventListener("click", () => {
            isAiMode = false;
            if (exitAiModeBtnWrapper) exitAiModeBtnWrapper.classList.add("d-none");
            fetchTours(1);
        });
    }
    // --- KẾT THÚC XỬ LÝ AI ---

    // Initial sequence
    fetchServices().then(() => fetchTours(1));
});

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
    } catch (error) {
        console.error("Không thể tải component:", error);
    }
}
