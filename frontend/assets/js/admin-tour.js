const TOUR_API_URL = "http://localhost:3000/api/tours";
const DEFAULT_TOUR_IMAGE = "../../assets/images/image.png";
const LIST_LOADING_HTML = '<div class="text-center p-4 text-muted">Đang tải danh sách tour...</div>';
const LIST_EMPTY_HTML = '<div class="text-center p-4 text-muted border rounded">Không có tour nào.</div>';
const LIST_MISSING_TEMPLATE_HTML = '<div class="alert alert-warning m-0">Thiếu template hiển thị danh sách tour.</div>';
const LIST_LOAD_ERROR_HTML = '<div class="alert alert-warning m-0">Không tải được dữ liệu tour từ API.</div>';

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

function getAdminToken() {
    return localStorage.getItem("token") || "";
}

function ensureAdminToken() {
    const token = getAdminToken();
    if (!token) {
        throw new Error("Bạn cần đăng nhập tài khoản admin để thực hiện thao tác này.");
    }
    return token;
}

function bindAddTourForm() {
    const form = document.getElementById("add-tour-form");
    if (!form || form.dataset.bound === "true") return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        setSubmitButtonState(submitBtn, { disabled: true, text: "Đang thêm..." });

        try {
            const token = ensureAdminToken();
            const payload = await buildTourPayloadFromForm(form, { imageFieldId: "cover_image" });

            const res = await fetch(TOUR_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await parseJsonSafe(res);
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data, `Thêm tour thất bại (HTTP ${res.status})`));
            }

            form.reset();
            hideModalById("addTourModal");
            await fetchAndRenderTours();
            alert("Thêm tour thành công");
        } catch (error) {
            alert(error.message || "Không thể thêm tour");
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
            alert("ID tour không hợp lệ");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        setSubmitButtonState(submitBtn, { disabled: true, text: "Đang lưu..." });

        try {
            const token = ensureAdminToken();
            const payload = await buildTourPayloadFromForm(form, {
                imageFieldId: "edit_cover_image",
                existingImageFieldName: "existing_image",
            });

            const res = await fetch(`${TOUR_API_URL}/${tourId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await parseJsonSafe(res);
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data, `Cập nhật tour thất bại (HTTP ${res.status})`));
            }

            hideModalById("editTourModal");
            await fetchAndRenderTours();
            alert("Cập nhật tour thành công");
        } catch (error) {
            alert(error.message || "Không thể cập nhật tour");
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
            alert("ID tour không hợp lệ");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        setSubmitButtonState(submitBtn, { disabled: true, text: "Đang xóa..." });

        try {
            const token = ensureAdminToken();
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
            alert("Xóa tour thành công");
        } catch (error) {
            alert(error.message || "Không thể xóa tour");
            console.error("Lỗi xóa tour:", error);
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
        listEl.innerHTML = LIST_LOADING_HTML;

        const res = await fetch(TOUR_API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const payload = await parseJsonSafe(res);
        adminTourCache = payload.success && Array.isArray(payload.data) ? payload.data : [];

        updateTourTotal(adminTourCache.length);
        renderTourList(adminTourCache);
    } catch (error) {
        listEl.innerHTML = LIST_LOAD_ERROR_HTML;
        updateTourTotal(0);
        console.error("Lỗi tải tour:", error);
    }
}

function bindTourSearch() {
    const input = document.getElementById("tour-search-input");
    if (!input || input.dataset.bound === "true") return;

    input.addEventListener("input", () => {
        const keyword = String(input.value || "")
            .trim()
            .toLowerCase();
        const filteredTours = adminTourCache.filter((tour) => isTourMatchedKeyword(tour, keyword));
        renderTourList(filteredTours);
    });

    input.dataset.bound = "true";
}

function isTourMatchedKeyword(tour, keyword) {
    const idText = String(tour.id ?? "").toLowerCase();
    const codeText = String(tour.tour_code ?? "").toLowerCase();
    const nameText = String(tour.name ?? "").toLowerCase();
    const regionText = String(tour.region ?? "").toLowerCase();
    return idText.includes(keyword) || codeText.includes(keyword) || nameText.includes(keyword) || regionText.includes(keyword);
}

function updateTourTotal(total) {
    const totalEl = document.getElementById("tour-total-count");
    if (totalEl) totalEl.textContent = String(total);
}

// Render danh sách tour từ template để tách UI khỏi logic lấy dữ liệu.
function renderTourList(tours) {
    const listEl = document.getElementById("tour-list-container");
    const template = document.getElementById("tour-list-item-template");
    if (!listEl) return;

    if (!Array.isArray(tours) || tours.length === 0) {
        listEl.innerHTML = LIST_EMPTY_HTML;
        return;
    }

    if (!(template instanceof HTMLTemplateElement)) {
        listEl.innerHTML = LIST_MISSING_TEMPLATE_HTML;
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
        code: tour.tour_code || `ID-${tour.id ?? "N/A"}`,
        region: tour.region || "Chưa cập nhật",
        duration: tour.duration || "Chưa cập nhật",
        price: formatVnd(tour.price ?? tour.price_default ?? 0),
        imageSrc: normalizeImage(tour),
    };

    const imageEl = node.querySelector(".tour-item-image");
    const nameEl = node.querySelector(".tour-item-name");
    const codeEl = node.querySelector(".tour-item-code");
    const regionEl = node.querySelector(".tour-item-region");
    const durationEl = node.querySelector(".tour-item-duration");
    const priceEl = node.querySelector(".tour-item-price");
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
    if (priceEl) priceEl.textContent = viewModel.price;

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
        alert("Không tìm thấy dữ liệu tour để chỉnh sửa.");
        return;
    }

    form.elements.id.value = String(tour.id ?? "");
    form.elements.name.value = String(tour.name || "");
    form.elements.location.value = String(tour.location || "");
    form.elements.price.value = String(tour.price ?? tour.price_default ?? "");
    form.elements.description.value = String(tour.description || "");
    form.elements.region.value = String(tour.region || "");
    form.elements.duration.value = String(tour.duration || "");
    form.elements.existing_image.value = getRawImageData(tour);

    const preview = document.getElementById("edit_preview");
    if (preview) {
        preview.src = normalizeImage(tour);
    }

    const fileInput = document.getElementById("edit_cover_image");
    if (fileInput) {
        fileInput.value = "";
    }
}

function getRawImageData(tour) {
    const imageValue = typeof tour.image === "string" && tour.image.length > 0 ? tour.image : typeof tour.cover_image === "string" ? tour.cover_image : "";
    if (!imageValue.startsWith("data:")) {
        return imageValue;
    }

    const parts = imageValue.split(",");
    return parts.length > 1 ? parts[1] : "";
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

async function buildTourPayloadFromForm(form, options = {}) {
    const imageFieldId = options.imageFieldId || "cover_image";
    const existingImageFieldName = options.existingImageFieldName || "";

    const fileInput = form.querySelector(`#${imageFieldId}`);
    const selectedFile = fileInput && fileInput.files ? fileInput.files[0] : null;

    let image = "";
    if (existingImageFieldName && form.elements[existingImageFieldName]) {
        image = String(form.elements[existingImageFieldName].value || "");
    }
    if (selectedFile) {
        image = await fileToBase64(selectedFile);
    }

    return {
        name: String(form.elements.name.value || "").trim(),
        description: String(form.elements.description.value || "").trim(),
        price: Number(form.elements.price ? form.elements.price.value : form.elements.price_default.value),
        region: String(form.elements.region.value || ""),
        duration: String(form.elements.duration.value || "").trim(),
        location: String(form.elements.location.value || "").trim(),
        image,
    };
}

function hideModalById(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;

    const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.hide();
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || "");
            const parts = result.split(",");
            resolve(parts.length > 1 ? parts[1] : result);
        };
        reader.onerror = () => reject(reader.error || new Error("Không đọc được file ảnh"));
        reader.readAsDataURL(file);
    });
}

function normalizeImage(tour) {
    const imageValue = getFirstAvailableImage(tour);
    if (!imageValue) return DEFAULT_TOUR_IMAGE;

    if (imageValue.startsWith("http") || imageValue.startsWith("data:")) {
        return imageValue;
    }
    return `data:image/jpeg;base64,${imageValue}`;
}

function getFirstAvailableImage(tour) {
    if (typeof tour.image === "string" && tour.image.trim() !== "") {
        return tour.image;
    }
    if (typeof tour.cover_image === "string" && tour.cover_image.trim() !== "") {
        return tour.cover_image;
    }
    return "";
}

function formatVnd(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
}

window.initAdminTourPage = initAdminTourPage;
