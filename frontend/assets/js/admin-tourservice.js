const TOUR_SERVICE_API_URL = "/api/tour-services";

let adminTourServiceCache = [];

async function initAdminTourServicePage() {
    if (typeof bootstrap === "undefined") {
        return;
    }

    const listEl = document.getElementById("tour-service-list");
    if (!listEl) {
        return;
    }

    bindTourServiceSearch();
    bindTourServiceActions();
    bindTourServiceForm();
    bindServiceFilter();
    bindServiceModalReset();

    await fetchAndRenderTourServices();
}

async function fetchAndRenderTourServices() {
    const listEl = document.getElementById("tour-service-list");
    if (!listEl) return;

    listEl.innerHTML = '<li class="list-group-item text-center p-4 text-muted">Đang tải danh sách tour...</li>';

    try {
        const payload = await fetchJson(`${TOUR_SERVICE_API_URL}/tours`);
        const tours = payload.success && Array.isArray(payload.data) ? payload.data : [];
        adminTourServiceCache = tours;

        renderTourServiceList(adminTourServiceCache);
        updateTourServiceTotal(adminTourServiceCache);
    } catch (error) {
        listEl.innerHTML = `<li class="list-group-item text-center p-4 text-danger">Không tải được dữ liệu tour. Lỗi: ${escapeHtml(error.message || "Unknown error")}</li>`;
        updateTourServiceTotal([]);
    }
}

function bindTourServiceSearch() {
    const input = document.querySelector(".search-input");
    if (!input || input.dataset.bound === "true") return;

    input.addEventListener("input", () => {
        const keyword = String(input.value || "")
            .trim()
            .toLowerCase();

        const filtered = adminTourServiceCache.filter((tour) => {
            const idText = String(tour.id ?? "").toLowerCase();
            const codeText = String(tour.code ?? "").toLowerCase();
            const nameText = String(tour.name ?? "").toLowerCase();
            const destinationText = String(tour.destination ?? "").toLowerCase();

            return idText.includes(keyword) || codeText.includes(keyword) || nameText.includes(keyword) || destinationText.includes(keyword);
        });

        renderTourServiceList(filtered);
        updateTourServiceTotal(filtered);
    });

    input.dataset.bound = "true";
}

function bindTourServiceActions() {
    const listEl = document.getElementById("tour-service-list");
    if (!listEl || listEl.dataset.bound === "true") return;

    listEl.addEventListener("click", async (event) => {
        const btn = event.target.closest(".open-service-modal");
        if (!btn) return;

        const tourId = Number(btn.dataset.tourId || NaN);
        if (!Number.isFinite(tourId)) return;

        await populateServiceForm(tourId);
    });

    listEl.dataset.bound = "true";
}

async function populateServiceForm(tourId) {
    const modalEl = document.getElementById("serviceModal");
    const modalTitleEl = document.getElementById("serviceModalLabel");
    const tourIdInput = document.getElementById("form-tour-id");
    const searchInput = document.getElementById("service-search-input");
    const servicesContainer = document.getElementById("services-container");
    if (!modalEl || !tourIdInput || !servicesContainer) return;

    const tour = adminTourServiceCache.find((item) => Number(item.id) === Number(tourId));
    const hasServices = !!(tour && Number(tour.serviceCount || 0) > 0);
    const actionName = hasServices ? "Chỉnh sửa" : "Thêm";

    if (modalTitleEl) {
        modalTitleEl.textContent = `${actionName} Dịch vụ cho Tour: ${tour ? tour.name || "(Không rõ tên)" : "(Không rõ tên)"}`;
    }

    tourIdInput.value = String(tourId);
    if (searchInput) searchInput.value = "";

    servicesContainer.innerHTML = '<div class="text-muted">Đang tải danh sách dịch vụ...</div>';

    try {
        const payload = await fetchJson(`${TOUR_SERVICE_API_URL}/${tourId}`);
        const services = payload.success && Array.isArray(payload.data?.services) ? payload.data.services : [];
        renderServiceCheckboxes(services);
    } catch (error) {
        servicesContainer.innerHTML = `<div class="text-danger">${escapeHtml(error.message || "Không thể tải dịch vụ")}</div>`;
    }

    const instance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
    instance.show();
}

function bindTourServiceForm() {
    const form = document.getElementById("service-form");
    if (!form || form.dataset.bound === "true") return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const tourId = Number(form.elements.tour_id ? form.elements.tour_id.value : NaN);
        if (!Number.isFinite(tourId)) {
            window.alert("tourId không hợp lệ");
            return;
        }

        const serviceIds = collectServicePayload();
        const submitBtn = form.querySelector('button[type="submit"]');
        setSubmitButtonState(submitBtn, { disabled: true, text: "Đang lưu..." });

        try {
            await fetchJson(`${TOUR_SERVICE_API_URL}/${tourId}`, {
                method: "PUT",
                body: JSON.stringify({ serviceIds }),
            });

            hideModalById("serviceModal");
            await fetchAndRenderTourServices();
        } catch (error) {
            window.alert(error.message || "Có lỗi khi lưu dịch vụ.");
        } finally {
            setSubmitButtonState(submitBtn, { disabled: false, text: "Lưu Dịch vụ" });
        }
    });

    form.dataset.bound = "true";
}

function bindServiceFilter() {
    const input = document.getElementById("service-search-input");
    if (!input || input.dataset.bound === "true") return;

    input.addEventListener("input", () => {
        const keyword = String(input.value || "")
            .trim()
            .toLowerCase();
        const items = document.querySelectorAll(".service-item");

        items.forEach((item) => {
            const code = String(item.getAttribute("data-service-id") || "").toLowerCase();
            const name = String(item.getAttribute("data-service-name") || "").toLowerCase();
            item.style.display = code.includes(keyword) || name.includes(keyword) ? "" : "none";
        });
    });

    input.dataset.bound = "true";
}

function bindServiceModalReset() {
    const modalEl = document.getElementById("serviceModal");
    const form = document.getElementById("service-form");
    const servicesContainer = document.getElementById("services-container");
    const serviceSearchInput = document.getElementById("service-search-input");
    if (!modalEl || !form || modalEl.dataset.boundReset === "true") return;

    modalEl.addEventListener("hidden.bs.modal", () => {
        form.reset();
        if (form.elements.tour_id) {
            form.elements.tour_id.value = "";
        }
        if (serviceSearchInput) {
            serviceSearchInput.value = "";
        }
        if (servicesContainer) {
            servicesContainer.innerHTML = "";
        }
    });

    modalEl.dataset.boundReset = "true";
}

function renderTourServiceList(tours) {
    const listEl = document.getElementById("tour-service-list");
    if (!listEl) return;

    if (!Array.isArray(tours) || tours.length === 0) {
        listEl.innerHTML = '<li class="list-group-item text-center py-4 text-muted">Không có dữ liệu tour.</li>';
        return;
    }

    listEl.innerHTML = tours
        .map((tour) => {
            const hasServices = !!tour.hasServices;
            const statusHtml = hasServices ? `<span class="text-success"><i class="fas fa-check-circle me-1"></i> Đã có dịch vụ (${Number(tour.serviceCount || 0)})</span>` : `<span class="text-warning"><i class="fas fa-exclamation-circle me-1"></i> Chưa có dịch vụ</span>`;
            const actionClass = hasServices ? "btn-outline-primary" : "btn-primary";
            const actionLabel = hasServices ? "Chỉnh sửa" : "Thêm mới";
            const actionIcon = hasServices ? "fa-edit" : "fa-plus";

            return `
            <li class="list-group-item p-3 hover-shadow">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-start align-items-center">
                            <div class="me-3"><span class="badge bg-secondary">${escapeHtml(tour.code || "")}</span></div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${escapeHtml(tour.name || "")}</h6>
                                <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${escapeHtml(tour.destination || "")}</small>
                                <br>
                                <small class="text-muted"><i class="fas fa-briefcase me-1"></i> ${statusHtml}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-sm ${actionClass} open-service-modal" data-tour-id="${tour.id}">
                            <i class="fas ${actionIcon}"></i> ${actionLabel}
                        </button>
                    </div>
                </div>
            </li>`;
        })
        .join("");
}

function renderServiceCheckboxes(services) {
    const container = document.getElementById("services-container");
    if (!container) return;

    if (!Array.isArray(services) || services.length === 0) {
        container.innerHTML = '<div class="text-muted">Không có dịch vụ.</div>';
        return;
    }

    container.innerHTML = services
        .map(
            (service) => `
        <div class="form-check mb-3 p-3 border rounded bg-light service-item"
            data-service-id="${escapeHtml(service.code || "")}"
            data-service-name="${escapeHtml(String(service.name || "").toLowerCase())}">
            <input class="form-check-input service-checkbox" type="checkbox" name="services[]" value="${service.id}" id="service-${service.id}" ${service.checked ? "checked" : ""}>
            <label class="form-check-label w-100 cursor-pointer" for="service-${service.id}">
                <strong>${escapeHtml(service.name || "")}</strong>
                <br>
                <small class="text-muted">Mã dịch vụ: ${escapeHtml(service.code || "")}</small>
                <br>
                <small class="text-muted">${escapeHtml(service.description || "")}</small>
            </label>
        </div>`,
        )
        .join("");
}

function collectServicePayload() {
    const selected = Array.from(document.querySelectorAll(".service-checkbox:checked"))
        .map((item) => Number(item.value))
        .filter((id) => Number.isInteger(id) && id > 0);

    return [...new Set(selected)];
}

function updateTourServiceTotal(tours) {
    const totalBadgeEl = document.getElementById("total-tour-has-service");
    if (!totalBadgeEl) return;

    const count = Array.isArray(tours) ? tours.filter((tour) => !!tour.hasServices).length : 0;
    totalBadgeEl.textContent = `Tổng: ${count} tour có dịch vụ`;
}

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    const payload = await parseJsonSafe(res);
    if (!res.ok || payload.success === false) {
        throw new Error(getApiErrorMessage(payload, `Request failed: ${res.status}`));
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

function hideModalById(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl || typeof bootstrap === "undefined") return;

    const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.hide();
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

window.initAdminTourServicePage = initAdminTourServicePage;

if (document.readyState !== "loading") {
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes("tour-service.html") || params.get("page") === "tour-service") {
        window.initAdminTourServicePage();
    }
} else {
    document.addEventListener("DOMContentLoaded", () => {
        const params = new URLSearchParams(window.location.search);
        if (window.location.pathname.includes("tour-service.html") || params.get("page") === "tour-service") {
            window.initAdminTourServicePage();
        }
    });
}
