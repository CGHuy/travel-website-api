(() => {
    const TOUR_API_URL = "/api/tours";
    const DEFAULT_TOUR_IMAGE = "../../assets/images/image-default.webp";

    let adminTourCache = [];

    // Hàm khởi tạo chính cho trang quản lý tour.
    async function initAdminTourPage() {
        const listEl = document.getElementById("tour-list-container");
        if (!listEl) return;

        bindTourSearch();
        bindAddTourForm();
        bindEditTourForm();
        bindDeleteTourForm();
        bindTourActions();
        bindEditImagePreview();
        bindEditModalReset();

        await fetchAndRenderTours();
    }

    function bindAddTourForm() {
        const form = document.getElementById("add-tour-form");
        if (!form || form.dataset.bound === "true") return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            setSubmitButtonState(submitBtn, { disabled: true, text: "Đang thêm..." });

            try {
                const token = localStorage.getItem("token") || "";
                const formData = buildTourFormData(form, { imageFieldId: "cover_image" });

                const res = await fetch(TOUR_API_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const data = await parseJsonSafe(res);
                if (!res.ok) {
                    throw new Error(getApiErrorMessage(data, `Thêm tour thất bại (HTTP ${res.status})`));
                }

                form.reset();
                hideModalById("addTourModal");
                await fetchAndRenderTours();
                showNotification("bg-success", "Thông báo", "Thêm tour thành công");
            } catch (error) {
                console.error("Lỗi thêm tour:", error);
            } finally {
                setSubmitButtonState(submitBtn, { disabled: false, text: "Thêm" });
            }
        });

        form.dataset.bound = "true";
    }

    function bindEditTourForm() {
        const form = document.getElementById("edit-tour-form");
        if (!form || form.dataset.bound === "true") return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const tourId = toFiniteNumber(form.elements.id.value);
            if (!Number.isFinite(tourId)) {
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            setSubmitButtonState(submitBtn, { disabled: true, text: "Đang lưu..." });

            try {
                const token = localStorage.getItem("token") || "";
                const formData = buildTourFormData(form, {
                    imageFieldId: "edit_cover_image",
                });

                const res = await fetch(`${TOUR_API_URL}/${tourId}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                const data = await parseJsonSafe(res);
                if (!res.ok) {
                    throw new Error(getApiErrorMessage(data, `Cập nhật tour thất bại (HTTP ${res.status})`));
                }

                hideModalById("editTourModal");
                await fetchAndRenderTours();
                showNotification("bg-primary", "Thông báo", "Cập nhật tour thành công");
            } catch (error) {
                console.error("Lỗi cập nhật tour:", error);
            } finally {
                setSubmitButtonState(submitBtn, { disabled: false, text: "Lưu" });
            }
        });

        form.dataset.bound = "true";
    }

    function bindDeleteTourForm() {
        const form = document.getElementById("delete-tour-form");
        if (!form || form.dataset.bound === "true") return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const id = toFiniteNumber(form.elements.id.value);
            if (!Number.isFinite(id)) {
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            setSubmitButtonState(submitBtn, { disabled: true, text: "Đang xóa..." });

            try {
                const token = localStorage.getItem("token") || "";
                const res = await fetch(`${TOUR_API_URL}/${id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await parseJsonSafe(res);
                if (!res.ok) {
                    throw new Error(getApiErrorMessage(data, `Xóa tour thất bại (HTTP ${res.status})`));
                }

                hideModalById("deleteTourModal");
                form.reset();
                await fetchAndRenderTours();
                showNotification("bg-danger", "Thông báo", "Xóa tour thành công");
            } catch (error) {
                console.error("Lỗi xóa tour:", error);
                hideModalById("deleteTourModal");
                showNotification("bg-danger", "Thông báo lỗi", error.message);
            } finally {
                setSubmitButtonState(submitBtn, { disabled: false, text: "Xóa" });
            }
        });

        form.dataset.bound = "true";
    }

    // Bắt sự kiện click cho danh sách động (edit/delete) bằng event delegation.
    function bindTourActions() {
        const listEl = document.getElementById("tour-list-container");
        if (!listEl || listEl.dataset.bound === "true") return;

        listEl.addEventListener("click", (event) => {
            const viewBtn = event.target.closest(".js-view-tour");
            if (viewBtn) {
                const id = toFiniteNumber(viewBtn.dataset.tourId);
                if (!Number.isFinite(id)) return;

                window.open(`/detail-tour?id=${id}`, "_blank", "noopener");
                return;
            }

            const editBtn = event.target.closest(".js-edit-tour");
            if (editBtn) {
                const id = toFiniteNumber(editBtn.dataset.tourId);
                if (!Number.isFinite(id)) return;

                populateEditTourForm(id);
                return;
            }

            const deleteBtn = event.target.closest(".js-delete-tour");
            if (!deleteBtn) return;

            const id = toFiniteNumber(deleteBtn.dataset.tourId);
            if (!Number.isFinite(id)) return;

            const deleteIdEl = document.getElementById("delete_id");
            const deleteNameEl = document.getElementById("delete_name");
            if (deleteIdEl) deleteIdEl.value = String(id);
            if (deleteNameEl) deleteNameEl.textContent = deleteBtn.dataset.tourName || "(Không rõ tên)";
        });

        listEl.dataset.bound = "true";
    }

    async function fetchAndRenderTours() {
        const listEl = document.getElementById("tour-list-container");
        if (!listEl) return;

        try {
            console.log("Đang tải danh sách tour...");
            listEl.innerHTML = "";

            const res = await fetch(TOUR_API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const payload = await parseJsonSafe(res);
            adminTourCache = payload.success && Array.isArray(payload.data) ? payload.data : [];

            const totalEl = document.getElementById("tour-total-count");
            if (totalEl) totalEl.textContent = String(adminTourCache.length);
            renderTourList(adminTourCache);
        } catch (error) {
            console.error("Không tải được dữ liệu tour từ API.", error);
            const totalEl = document.getElementById("tour-total-count");
            if (totalEl) totalEl.textContent = "0";
        }
    }

    function bindTourSearch() {
        const input = document.getElementById("tour-search-input");
        const searchBtn = document.getElementById("tour-search-btn");
        if (!input || input.dataset.bound === "true") return;

        const runSearch = () => {
            const keyword = String(input.value || "")
                .trim()
                .toLowerCase();
            const filteredTours = adminTourCache.filter((tour) => isTourMatchedKeyword(tour, keyword));
            renderTourList(filteredTours);
        };

        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            runSearch();
        });

        input.addEventListener("input", () => {
            if (String(input.value || "").trim() !== "") return;
            renderTourList(adminTourCache);
        });

        if (searchBtn) {
            searchBtn.addEventListener("click", runSearch);
        }

        input.dataset.bound = "true";
    }

    function isTourMatchedKeyword(tour, keyword) {
        const idText = String(tour.id ?? "").toLowerCase();
        const codeText = String(tour.code ?? "").toLowerCase();
        const nameText = String(tour.name ?? "").toLowerCase();
        const regionText = String(tour.region ?? "").toLowerCase();
        return idText.includes(keyword) || codeText.includes(keyword) || nameText.includes(keyword) || regionText.includes(keyword);
    }

    // Render danh sách tour từ template để tách UI khỏi logic lấy dữ liệu.
    function renderTourList(tours) {
        const listEl = document.getElementById("tour-list-container");
        const template = document.getElementById("tour-list-item-template");
        if (!listEl) return;

        if (!Array.isArray(tours) || tours.length === 0) {
            console.log("Không có tour nào.");
            listEl.innerHTML = "";
            return;
        }

        if (!(template instanceof HTMLTemplateElement)) {
            console.warn("Thiếu template hiển thị danh sách tour.");
            listEl.innerHTML = "";
            return;
        }

        const fragment = document.createDocumentFragment();
        tours.forEach((tour) => {
            const node = buildTourListItemNode(template, tour);
            if (node) fragment.appendChild(node);
        });

        listEl.innerHTML = "";
        listEl.appendChild(fragment);
    }

    function buildTourListItemNode(template, tour) {
        const node = template.content.firstElementChild.cloneNode(true);
        if (!node) return null;

        const viewModel = {
            id: String(tour.id ?? ""),
            name: tour.name || "Chưa có tên",
            code: String(tour.code || ""),
            region: tour.region || "Chưa cập nhật",
            duration: tour.duration || "Chưa cập nhật",
            price_default: formatVnd(tour.price_default ?? 0),
            price_child: formatVnd(tour.price_child ?? 0),
            imageSrc: normalizeImage(tour),
        };

        const imageEl = node.querySelector(".tour-item-image");
        const nameEl = node.querySelector(".tour-item-name");
        const codeEl = node.querySelector(".tour-item-code");
        const regionEl = node.querySelector(".tour-item-region");
        const durationEl = node.querySelector(".tour-item-duration");
        const priceDefaultEl = node.querySelector(".tour-item-price-default");
        const priceChildEl = node.querySelector(".tour-item-price-child");
        const viewBtn = node.querySelector(".js-view-tour");
        const editBtn = node.querySelector(".js-edit-tour");
        const deleteBtn = node.querySelector(".js-delete-tour");

        if (imageEl) {
            imageEl.src = viewModel.imageSrc;
            imageEl.alt = viewModel.name;
        }
        if (nameEl) nameEl.textContent = viewModel.name;
        if (codeEl) codeEl.textContent = viewModel.code;
        if (regionEl) regionEl.textContent = viewModel.region;
        if (durationEl) durationEl.textContent = viewModel.duration;
        if (priceDefaultEl) priceDefaultEl.textContent = viewModel.price_default;
        if (priceChildEl) priceChildEl.textContent = viewModel.price_child;

        if (viewBtn) {
            viewBtn.dataset.tourId = viewModel.id;
        }
        if (editBtn) {
            editBtn.dataset.tourId = viewModel.id;
        }
        if (deleteBtn) {
            deleteBtn.dataset.tourId = viewModel.id;
            deleteBtn.dataset.tourName = viewModel.name;
        }

        return node;
    }

    function populateEditTourForm(tourId) {
        const form = document.getElementById("edit-tour-form");
        if (!form) return;

        const tour = adminTourCache.find((item) => Number(item.id) === Number(tourId));
        if (!tour) {
            console.error("Không tìm thấy dữ liệu tour để chỉnh sửa.");
            return;
        }

        setFormElementValue(form, "id", String(tour.id ?? ""));
        setFormElementValue(form, "name", String(tour.name || ""));
        setFormElementValue(form, "description", String(tour.description || ""));
        setFormElementValue(form, "slug", String(tour.slug || ""));

        setFormElementValue(form, "location", String(tour.location || ""));
        setFormElementValue(form, "region", String(tour.region || ""));
        setFormElementValue(form, "duration", String(tour.duration || ""));

        setFormElementValue(form, "price_default", String(tour.price_default ?? ""));
        setFormElementValue(form, "price_child", String(tour.price_child ?? ""));

        const rawImageValue = typeof tour.image === "string" && tour.image.length > 0 ? tour.image : typeof tour.cover_image === "string" ? tour.cover_image : "";
        let existingImage = "";
        if (rawImageValue.startsWith("data:")) {
            const parts = rawImageValue.split(",");
            existingImage = parts.length > 1 ? parts[1] : "";
        } else {
            existingImage = rawImageValue;
        }
        setFormElementValue(form, "existing_image", existingImage);

        const preview = document.getElementById("edit_preview");
        if (preview) {
            preview.src = normalizeImage(tour);
        }

        const fileInput = document.getElementById("edit_cover_image");
        if (fileInput) {
            fileInput.value = "";
        }
    }

    function setFormElementValue(form, fieldName, value) {
        const field = form.elements[fieldName];
        if (field) {
            field.value = value;
        }
    }

    function bindEditImagePreview() {
        const input = document.getElementById("edit_cover_image");
        const preview = document.getElementById("edit_preview");
        if (!input || !preview || input.dataset.bound === "true") return;

        // Khi chọn file mới thì cập nhật preview ngay để người dùng kiểm tra ảnh.
        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (!file) return;
            preview.src = URL.createObjectURL(file);
        });

        input.dataset.bound = "true";
    }

    function bindEditModalReset() {
        const modalEl = document.getElementById("editTourModal");
        const form = document.getElementById("edit-tour-form");
        const preview = document.getElementById("edit_preview");
        if (!modalEl || !form || !preview || modalEl.dataset.boundReset === "true") return;

        modalEl.addEventListener("hidden.bs.modal", () => {
            form.reset();
            form.elements.id.value = "";
            form.elements.existing_image.value = "";
            preview.src = DEFAULT_TOUR_IMAGE;
        });

        modalEl.dataset.boundReset = "true";
    }

    function buildTourFormData(form, options = {}) {
        const imageFieldId = options.imageFieldId || "cover_image";
        const formData = new FormData();

        // Thêm các trường text
        formData.append("name", String(form.elements.name.value || "").trim());
        formData.append("slug", String(form.elements.slug ? form.elements.slug.value : "").trim());
        formData.append("description", String(form.elements.description.value || "").trim());

        formData.append("price_default", Number(form.elements.price_default ? form.elements.price_default.value : 0));
        formData.append("price_child", Number(form.elements.price_child ? form.elements.price_child.value : 0));

        formData.append("region", String(form.elements.region.value || ""));
        formData.append("duration", String(form.elements.duration.value || "").trim());
        formData.append("location", String(form.elements.location.value || "").trim());

        // Thêm file ảnh nếu có
        const fileInput = form.querySelector(`#${imageFieldId}`);
        if (fileInput && fileInput.files && fileInput.files[0]) {
            formData.append("image", fileInput.files[0]);
        }

        return formData;
    }

    function hideModalById(modalId) {
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;

        const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
    }

    function showNotification(header, title, message) {
        const modalHeaderEl = document.getElementById("TypeDialog");
        const modalEl = document.getElementById("notificationModal");
        const titleEl = document.getElementById("notificationModalLabel");
        const messageEl = document.getElementById("notificationMessage");

        if (!modalEl || !messageEl || !modalHeaderEl) return;

        modalHeaderEl.classList.remove("bg-success", "bg-primary", "bg-danger");
        if (header) {
            modalHeaderEl.classList.add(header);
        }

        if (titleEl) {
            titleEl.textContent = title;
        }
        messageEl.textContent = message;

        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
    }

    function setSubmitButtonState(button, state) {
        if (!button) return;
        button.disabled = state.disabled;
        button.textContent = state.text;
    }

    function toFiniteNumber(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    async function parseJsonSafe(response) {
        return response.json().catch(() => ({}));
    }

    function getApiErrorMessage(data, fallbackMessage) {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            return data.errors.join("\n");
        }
        if (data && typeof data.message === "string" && data.message.trim() !== "") {
            return data.message;
        }
        return fallbackMessage;
    }

    function normalizeImage(tour) {
        let imageValue = "";
        if (typeof tour.image === "string" && tour.image.trim() !== "") {
            imageValue = tour.image;
        } else if (typeof tour.cover_image === "string" && tour.cover_image.trim() !== "") {
            imageValue = tour.cover_image;
        }

        if (!imageValue) return DEFAULT_TOUR_IMAGE;
        if (imageValue.startsWith("http") || imageValue.startsWith("data:")) {
            return imageValue;
        }
        return `data:image/jpeg;base64,${imageValue}`;
    }

    function formatVnd(value) {
        const amount = Number(value) || 0;
        return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
    }

    window.initAdminTourPage = initAdminTourPage;
})();
