(() => {
    const TOUR_IMAGE_TOURS_API_URL = "/api/tour-images/tours";
    const TOUR_IMAGE_API_URL = "/api/tour-images";
    const DEFAULT_TOUR_IMAGE = "../../assets/images/image-default.webp";
    const ITEMS_PER_PAGE = 5;

    let adminTourImageCache = [];
    let currentTourImages = [];
    let activeTourForImages = null;
    let currentPage = 1;
    let totalPages = 1;
    let totalTours = 0;
    let currentKeyword = "";

    async function initAdminTourImagePage() {
        const listEl = document.getElementById("tour-image-list");
        if (!listEl) return;

        bindTourImageSearch();
        bindTourImageListActions();
        bindUploadImageForm();
        bindUploadPreview();
        bindModalReset();

        await fetchAndRenderTours({ page: 1 });
    }

    async function fetchAndRenderTours(options = {}) {
        const listEl = document.getElementById("tour-image-list");
        const paginationEl = document.getElementById("tour-image-pagination-container");
        if (!listEl) return;

        listEl.innerHTML = '<div class="text-center p-4 text-muted">Đang tải danh sách tour...</div>';

        try {
            const page = Math.max(Number(options.page) || 1, 1);
            const keyword = typeof options.keyword === "string" ? options.keyword.trim().toLowerCase() : currentKeyword;

            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
            });
            if (keyword) params.set("q", keyword);

            const payload = await fetchJson(`${TOUR_IMAGE_TOURS_API_URL}?${params.toString()}`, { method: "GET" }, false);
            const tours = payload.success && Array.isArray(payload.data) ? payload.data : [];
            const pagination = payload && typeof payload === "object" ? payload.pagination : null;

            adminTourImageCache = tours;
            currentPage = Number(pagination && pagination.currentPage) || page;
            totalPages = Number(pagination && pagination.totalPages) || 1;
            totalTours = Number(pagination && pagination.total) || 0;
            currentKeyword = keyword;

            renderTourImageCards(adminTourImageCache);
            updateTotalBadge(totalTours);
            if (paginationEl) {
                renderPaginationButtons(paginationEl);
            }
        } catch (error) {
            listEl.innerHTML = `<div class="alert alert-warning mb-0">Không thể tải danh sách tour: ${escapeHtml(error.message || "Unknown error")}</div>`;
            updateTotalBadge(0);
            if (paginationEl) paginationEl.innerHTML = "";
        }
    }

    function bindTourImageSearch() {
        const input = document.getElementById("tour-image-search-input");
        const button = document.getElementById("tour-image-search-btn");
        if (!input || input.dataset.bound === "true") return;

        let searchTimeout;

        const runSearch = () => {
            const keyword = String(input.value || "")
                .trim()
                .toLowerCase();

            fetchAndRenderTours({ page: 1, keyword });
        };

        input.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(runSearch, 300);
        });

        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            runSearch();
        });

        if (button) {
            button.addEventListener("click", runSearch);
        }

        input.dataset.bound = "true";
    }

    function renderTourImageCards(tours) {
        const listEl = document.getElementById("tour-image-list");
        const template = document.getElementById("tour-image-card-template");
        if (!listEl) return;

        if (!Array.isArray(tours) || tours.length === 0) {
            listEl.innerHTML = '<div class="text-center p-4 text-muted">Không có tour phù hợp.</div>';
            return;
        }

        if (!(template instanceof HTMLTemplateElement)) {
            listEl.innerHTML = '<div class="text-center p-4 text-danger">Thiếu template hiển thị tour.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        tours.forEach((tour) => {
            const node = template.content.firstElementChild.cloneNode(true);
            if (!node) return;

            const id = Number(tour.id || 0);
            const code = String(tour.code || "");
            const name = String(tour.name || "Chưa có tên");
            const mainImage = normalizeImage(tour);
            const imageCount = Number(tour.image_count || 0);

            const imageEl = node.querySelector(".tour-image-main");
            const nameEl = node.querySelector(".tour-item-name");
            const codeEl = node.querySelector(".tour-item-code");
            const countEl = node.querySelector(".tour-image-count");
            const openBtn = node.querySelector(".js-open-image-manager");

            if (imageEl) {
                imageEl.src = mainImage;
                imageEl.alt = name;
            }
            if (nameEl) nameEl.textContent = name;
            if (codeEl) codeEl.textContent = code;
            if (countEl) countEl.textContent = `Số ảnh phụ: ${imageCount}`;
            if (openBtn) {
                openBtn.dataset.tourId = String(id);
                openBtn.dataset.tourName = name;
            }

            fragment.appendChild(node);
        });

        listEl.innerHTML = "";
        listEl.appendChild(fragment);
    }

    function bindTourImageListActions() {
        const listEl = document.getElementById("tour-image-list");
        if (!listEl || listEl.dataset.bound === "true") return;

        listEl.addEventListener("click", async (event) => {
            const openBtn = event.target.closest(".js-open-image-manager");
            if (!openBtn) return;

            const tourId = Number(openBtn.dataset.tourId || NaN);
            if (!Number.isFinite(tourId)) return;

            await openTourImageModal({
                id: tourId,
                name: openBtn.dataset.tourName || "(Không rõ tên)",
            });
        });

        listEl.dataset.bound = "true";
    }

    async function openTourImageModal(tour) {
        const modalEl = document.getElementById("tourImageModal");
        const modalTitleEl = document.getElementById("tourImageModalLabel");
        const formTourIdEl = document.getElementById("tour-image-tour-id");
        const listEl = document.getElementById("tour-image-grid");
        if (!modalEl || !formTourIdEl || !listEl) return;

        activeTourForImages = tour;
        formTourIdEl.value = String(tour.id);

        if (modalTitleEl) {
            modalTitleEl.textContent = `Quản lý ảnh phụ cho tour: ${tour.name}`;
        }

        listEl.innerHTML = '<div class="text-muted">Đang tải ảnh...</div>';

        try {
            const payload = await fetchJson(`${TOUR_IMAGE_API_URL}/tour/${tour.id}`, { method: "GET" }, false);
            currentTourImages = payload.success && Array.isArray(payload.data?.images) ? payload.data.images : [];
            renderModalImageGrid(currentTourImages);
        } catch (error) {
            currentTourImages = [];
            listEl.innerHTML = `<div class="text-danger">Không thể tải ảnh: ${escapeHtml(error.message || "Unknown error")}</div>`;
        }

        const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    }

    function renderModalImageGrid(images) {
        const gridEl = document.getElementById("tour-image-grid");
        const template = document.getElementById("tour-image-item-template");
        if (!gridEl) return;

        if (!Array.isArray(images) || images.length === 0) {
            gridEl.innerHTML = '<div class="empty-image-note">Tour này chưa có ảnh phụ.</div>';
            updateModalTotal(0);
            return;
        }

        if (!(template instanceof HTMLTemplateElement)) {
            gridEl.innerHTML = '<div class="text-danger">Thiếu template ảnh.</div>';
            updateModalTotal(0);
            return;
        }

        const fragment = document.createDocumentFragment();

        images.forEach((item) => {
            const node = template.content.firstElementChild.cloneNode(true);
            if (!node) return;

            const imageEl = node.querySelector("img");
            const deleteBtn = node.querySelector(".js-delete-tour-image");

            if (imageEl) {
                imageEl.src = normalizeImageUrl(item.image);
                imageEl.alt = `Ảnh tour #${item.id}`;
            }

            if (deleteBtn) {
                deleteBtn.dataset.imageId = String(item.id);
            }

            fragment.appendChild(node);
        });

        gridEl.innerHTML = "";
        gridEl.appendChild(fragment);
        updateModalTotal(images.length);

        bindDeleteImageButtons();
    }

    function bindDeleteImageButtons() {
        const gridEl = document.getElementById("tour-image-grid");
        if (!gridEl) return;

        const buttons = gridEl.querySelectorAll(".js-delete-tour-image");
        buttons.forEach((btn) => {
            if (btn.dataset.bound === "true") return;

            btn.addEventListener("click", async () => {
                const imageId = Number(btn.dataset.imageId || NaN);
                if (!Number.isFinite(imageId)) return;

                const accepted = window.confirm("Bạn có chắc muốn xóa ảnh này?");
                if (!accepted) return;

                await deleteTourImage(imageId);
            });

            btn.dataset.bound = "true";
        });
    }

    function bindUploadImageForm() {
        const form = document.getElementById("add-tour-image-form");
        if (!form || form.dataset.bound === "true") return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const tourId = Number(form.elements.tour_id?.value || NaN);
            const fileInput = form.elements.image;

            if (!Number.isFinite(tourId)) {
                window.alert("Tour không hợp lệ.");
                return;
            }

            if (!fileInput || !fileInput.files || !fileInput.files[0]) {
                window.alert("Vui lòng chọn ảnh trước khi tải lên.");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            setSubmitButtonState(submitBtn, { disabled: true, text: "Đang tải..." });

            try {
                const formData = new FormData();
                formData.append("image", fileInput.files[0]);

                await fetchJson(
                    `${TOUR_IMAGE_API_URL}/tour/${tourId}`,
                    {
                        method: "POST",
                        body: formData,
                    },
                    true,
                );

                form.reset();
                resetUploadPreview();
                await refreshActiveTourImages();
                await refreshSingleTourCardCount(tourId);
            } catch (error) {
                window.alert(error.message || "Tải ảnh lên thất bại.");
            } finally {
                setSubmitButtonState(submitBtn, { disabled: false, text: "Tải ảnh lên" });
            }
        });

        form.dataset.bound = "true";
    }

    async function deleteTourImage(imageId) {
        try {
            await fetchJson(
                `${TOUR_IMAGE_API_URL}/${imageId}`,
                {
                    method: "DELETE",
                },
                true,
            );

            await refreshActiveTourImages();
            if (activeTourForImages && Number.isFinite(Number(activeTourForImages.id))) {
                await refreshSingleTourCardCount(Number(activeTourForImages.id));
            }
        } catch (error) {
            window.alert(error.message || "Xóa ảnh thất bại.");
        }
    }

    async function refreshActiveTourImages() {
        if (!activeTourForImages || !Number.isFinite(Number(activeTourForImages.id))) return;

        const payload = await fetchJson(`${TOUR_IMAGE_API_URL}/tour/${activeTourForImages.id}`, { method: "GET" }, false);
        currentTourImages = payload.success && Array.isArray(payload.data?.images) ? payload.data.images : [];
        renderModalImageGrid(currentTourImages);
    }

    async function refreshSingleTourCardCount(tourId) {
        await fetchAndRenderTours({ page: currentPage, keyword: currentKeyword });

        const selectedTour = adminTourImageCache.find((tour) => Number(tour.id) === Number(tourId));
        if (selectedTour && activeTourForImages) {
            activeTourForImages.name = selectedTour.name || activeTourForImages.name;
        }
    }

    function bindUploadPreview() {
        const fileInput = document.getElementById("tour-image-file");
        if (!fileInput || fileInput.dataset.bound === "true") return;

        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                resetUploadPreview();
                return;
            }

            const previewEl = document.getElementById("tour-image-preview");
            if (!previewEl) return;

            previewEl.src = URL.createObjectURL(file);
        });

        fileInput.dataset.bound = "true";
    }

    function bindModalReset() {
        const modalEl = document.getElementById("tourImageModal");
        const form = document.getElementById("add-tour-image-form");
        const gridEl = document.getElementById("tour-image-grid");
        if (!modalEl || !form || !gridEl || modalEl.dataset.boundReset === "true") return;

        modalEl.addEventListener("hidden.bs.modal", () => {
            form.reset();
            currentTourImages = [];
            activeTourForImages = null;
            gridEl.innerHTML = "";
            updateModalTotal(0);
            resetUploadPreview();
        });

        modalEl.dataset.boundReset = "true";
    }

    function updateTotalBadge(count) {
        const badgeEl = document.getElementById("tour-image-total-count");
        if (!badgeEl) return;
        badgeEl.textContent = String(count);
    }

    function updateModalTotal(count) {
        const modalCountEl = document.getElementById("tour-image-modal-count");
        if (!modalCountEl) return;
        modalCountEl.textContent = String(count);
    }

    function renderPaginationButtons(container) {
        container.innerHTML = "";

        if (totalPages <= 1) return;

        let html = '<div class="pagination-buttons">';
        html += `<button class="p-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);

        for (let i = start; i <= end; i++) {
            html += `<button class="p-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
        }

        html += `<button class="p-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;
        html += "</div>";

        container.innerHTML = html;
        container.querySelectorAll(".p-btn[data-page]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const page = Number(btn.dataset.page);
                if (!Number.isFinite(page) || page < 1 || page > totalPages || page === currentPage) return;

                fetchAndRenderTours({ page, keyword: currentKeyword });
                document.getElementById("tour-image-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    function resetUploadPreview() {
        const previewEl = document.getElementById("tour-image-preview");
        if (!previewEl) return;
        previewEl.src = DEFAULT_TOUR_IMAGE;
    }

    function normalizeImage(tour) {
        const imageValue = typeof tour.cover_image === "string" && tour.cover_image.trim() !== "" ? tour.cover_image : typeof tour.image === "string" ? tour.image : "";
        return normalizeImageUrl(imageValue);
    }

    function normalizeImageUrl(value) {
        if (typeof value !== "string" || value.trim() === "") {
            return DEFAULT_TOUR_IMAGE;
        }

        if (value.startsWith("http") || value.startsWith("data:")) {
            return value;
        }

        return `data:image/jpeg;base64,${value}`;
    }

    async function fetchJson(url, options = {}, useAuth = false) {
        const headers = {};

        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        if (useAuth) {
            const token = localStorage.getItem("token") || "";
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {}),
            },
        });

        const payload = await parseJsonSafe(response);
        if (!response.ok || payload.success === false) {
            throw new Error(getApiErrorMessage(payload, `Request failed: ${response.status}`));
        }

        return payload;
    }

    async function parseJsonSafe(response) {
        return response.json().catch(() => ({}));
    }

    function getApiErrorMessage(data, fallbackMessage) {
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
            return data.errors.join("\n");
        }
        if (typeof data?.message === "string" && data.message.trim() !== "") {
            return data.message;
        }
        return fallbackMessage;
    }

    function setSubmitButtonState(button, state) {
        if (!button) return;
        button.disabled = !!state.disabled;
        if (typeof state.text === "string") {
            button.textContent = state.text;
        }
    }

    function escapeHtml(str = "") {
        return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }

    window.initAdminTourImagePage = initAdminTourImagePage;
})();
