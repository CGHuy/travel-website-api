const ITINERARY_TOUR_API_URL = "/api/tours";
const ITINERARY_API_URL = "/api/tourItinerary";

let adminItineraryCache = [];
let pendingDeleteAllTourId = NaN;

async function initAdminItineraryPage() {
    const listEl = document.getElementById("tour-itinerary-list");
    if (!listEl) {
        return;
    }

    bindItinerarySearch();
    bindItineraryActions();
    bindItineraryForm();
    bindAddDayButton();
    bindRemoveDayButton();
    bindDeleteAllItineraryButton();
    bindDeleteAllItineraryConfirmButton();
    bindItineraryModalReset();

    await fetchAndRenderItineraryTours();
}

async function fetchAndRenderItineraryTours() {
    const listEl = document.getElementById("tour-itinerary-list");
    if (!listEl) {
        return;
    }

    listEl.innerHTML = '<li class="list-group-item text-center p-4 text-muted">Đang tải danh sách tour...</li>';

    try {
        const tourRes = await fetch(ITINERARY_TOUR_API_URL);
        if (!tourRes.ok) throw new Error(`HTTP ${tourRes.status}`);

        const tourPayload = await parseJsonSafe(tourRes);

        const tours = tourPayload.success && Array.isArray(tourPayload.data) ? tourPayload.data : [];

        const toursWithItineraries = await Promise.all(
            tours.map(async (tour) => {
                const itineraries = await fetchTourItinerarySafely(tour.id);
                return {
                    ...tour,
                    itineraries,
                };
            }),
        );

        adminItineraryCache = toursWithItineraries;

        const totalEl = document.getElementById("itinerary-total-count");
        if (totalEl) {
            const count = toursWithItineraries.filter((tour) => tour.itineraries.length > 0).length;
            totalEl.textContent = String(count);
        }

        renderItineraryTourList(adminItineraryCache);
    } catch (error) {
        listEl.innerHTML = '<li class="list-group-item text-center p-4 text-danger">Không tải được dữ liệu tour. Lỗi: ' + error.message + "</li>";

        const totalEl = document.getElementById("itinerary-total-count");
        if (totalEl) totalEl.textContent = "0";
    }
}

async function fetchTourItinerarySafely(tourId) {
    try {
        const url = `${ITINERARY_API_URL}/${tourId}`;
        const res = await fetch(url);
        if (!res.ok) return {};
        const payload = await parseJsonSafe(res);
        return payload.success && Array.isArray(payload.data) ? payload.data : [];
    } catch (error) {
        return [];
    }
}

function bindItinerarySearch() {
    const input = document.getElementById("itinerary-search-input");
    if (!input || input.dataset.bound === "true") return;

    input.addEventListener("input", () => {
        const keyword = String(input.value || "")
            .trim()
            .toLowerCase();

        const filtered = adminItineraryCache.filter((tour) => {
            const idText = String(tour.id ?? "").toLowerCase();
            const codeText = String(tour.id_code ?? tour.tour_code ?? "").toLowerCase();
            const nameText = String(tour.name ?? "").toLowerCase();
            return idText.includes(keyword) || codeText.includes(keyword) || nameText.includes(keyword);
        });

        renderItineraryTourList(filtered);
    });

    input.dataset.bound = "true";
}

function renderItineraryTourList(tours) {
    const listEl = document.getElementById("tour-itinerary-list");
    const template = document.getElementById("tour-itinerary-item-template");
    const emptyTemplate = document.getElementById("tour-itinerary-empty-template");
    if (!listEl) return;

    if (!Array.isArray(tours) || tours.length === 0) {
        if (emptyTemplate instanceof HTMLTemplateElement) {
            listEl.innerHTML = "";
            listEl.appendChild(emptyTemplate.content.cloneNode(true));
        } else {
            listEl.innerHTML = '<li class="list-group-item text-center py-4 text-muted">Không có tour nào.</li>';
        }
        return;
    }

    if (!(template instanceof HTMLTemplateElement)) {
        listEl.innerHTML = '<li class="list-group-item text-center py-4 text-danger">Thiếu template danh sách lịch trình.</li>';
        return;
    }

    const fragment = document.createDocumentFragment();
    tours.forEach((tour) => {
        const node = buildItineraryTourNode(template, tour);
        if (node) fragment.appendChild(node);
    });

    listEl.innerHTML = "";
    listEl.appendChild(fragment);
}

function buildItineraryTourNode(template, tour) {
    const node = template.content.firstElementChild.cloneNode(true);
    if (!node) return null;

    const hasItinerary = Array.isArray(tour.itineraries) && tour.itineraries.length > 0;
    const statusText = hasItinerary ? `Đã có ${tour.itineraries.length} ngày lịch trình` : "Chưa có lịch trình";

    const codeEl = node.querySelector(".itinerary-tour-code");
    const nameEl = node.querySelector(".itinerary-tour-name");
    const statusWrapEl = node.querySelector(".itinerary-status-wrap");
    const statusEl = node.querySelector(".itinerary-status");
    const actionTextEl = node.querySelector(".itinerary-action-text");
    const actionBtn = node.querySelector(".open-itinerary-modal");

    if (codeEl) codeEl.textContent = tour.id_code || tour.tour_code || `TOUR-${String(tour.id ?? "").padStart(3, "0")}`;
    if (nameEl) nameEl.textContent = tour.name || "Chưa có tên";
    if (statusEl) {
        statusEl.className = `itinerary-status ${hasItinerary ? "text-success" : "text-warning"}`;
        statusEl.innerHTML = hasItinerary ? `<i class="fas fa-check-circle me-1"></i>${statusText}` : `<i class="fas fa-exclamation-circle me-1"></i>${statusText}`;
    }
    if (statusWrapEl) {
        statusWrapEl.dataset.hasItinerary = hasItinerary ? "true" : "false";
    }
    if (actionTextEl) actionTextEl.textContent = hasItinerary ? "Chỉnh sửa" : "Thêm mới";
    if (actionBtn) {
        actionBtn.dataset.tourId = String(tour.id ?? "");
        actionBtn.dataset.tourName = tour.name || "(Không rõ tên)";
        actionBtn.dataset.actionName = hasItinerary ? "Chỉnh sửa" : "Thêm";
    }

    return node;
}

function bindItineraryActions() {
    const listEl = document.getElementById("tour-itinerary-list");
    if (!listEl || listEl.dataset.bound === "true") return;

    listEl.addEventListener("click", (event) => {
        const btn = event.target.closest(".open-itinerary-modal");
        if (!btn) return;

        const tourId = Number(btn.dataset.tourId);
        if (!Number.isFinite(tourId)) return;

        populateItineraryForm(tourId);
    });

    listEl.dataset.bound = "true";
}

function populateItineraryForm(tourId) {
    const form = document.getElementById("itinerary-form");
    const modalTitle = document.getElementById("itineraryModalLabel");
    const deleteAllBtn = document.getElementById("delete-all-itinerary-btn");
    const tour = adminItineraryCache.find((item) => Number(item.id) === Number(tourId));
    if (!form || !tour) return;

    const hasItinerary = Array.isArray(tour.itineraries) && tour.itineraries.length > 0;

    if (modalTitle) {
        modalTitle.textContent = `${hasItinerary ? "Chỉnh sửa" : "Thêm"} Lịch Trình cho Tour: ${tour.name || "(Không rõ tên)"}`;
    }

    if (form.elements.tour_id) {
        form.elements.tour_id.value = String(tour.id);
    }

    if (deleteAllBtn) {
        deleteAllBtn.dataset.tourId = String(tour.id);
        deleteAllBtn.dataset.tourName = tour.name || "(Không rõ tên)";
        deleteAllBtn.disabled = !hasItinerary;
    }

    renderItineraryDays(Array.isArray(tour.itineraries) ? tour.itineraries : []);
}

function renderItineraryDays(days) {
    const container = document.getElementById("itinerary-days-container");
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(days) || days.length === 0) {
        appendNewDayItem();
        updateDayInputs();
        return;
    }

    const sortedDays = [...days].sort((a, b) => Number(a.day_number) - Number(b.day_number));
    sortedDays.forEach((day) => appendNewDayItem(String(day.description || "")));
    updateDayInputs();
}

function bindAddDayButton() {
    const addDayBtn = document.getElementById("add-day-btn");
    if (!addDayBtn || addDayBtn.dataset.bound === "true") return;

    addDayBtn.addEventListener("click", () => {
        appendNewDayItem();
        updateDayInputs();
    });

    addDayBtn.dataset.bound = "true";
}

function bindRemoveDayButton() {
    const container = document.getElementById("itinerary-days-container");
    if (!container || container.dataset.boundRemove === "true") return;

    container.addEventListener("click", (event) => {
        const removeBtn = event.target.closest(".remove-day-btn");
        if (!removeBtn) return;

        const items = container.querySelectorAll(".itinerary-day-item");
        if (items.length <= 1) {
            return;
        }

        const item = removeBtn.closest(".itinerary-day-item");
        if (item) item.remove();
        updateDayInputs();
    });

    container.dataset.boundRemove = "true";
}

function appendNewDayItem(initialDescription = "") {
    const container = document.getElementById("itinerary-days-container");
    const dayTemplate = document.getElementById("itinerary-day-template");
    if (!container || !(dayTemplate instanceof HTMLTemplateElement)) return;

    const wrapper = dayTemplate.content.firstElementChild.cloneNode(true);
    if (!wrapper) return;

    const descEl = wrapper.querySelector(".day-description-textarea");
    if (descEl) {
        descEl.value = initialDescription;
    }

    container.appendChild(wrapper);
}

function updateDayInputs() {
    const container = document.getElementById("itinerary-days-container");
    if (!container) return;

    container.querySelectorAll(".itinerary-day-item").forEach((item, index) => {
        const dayNumber = index + 1;

        const dayTitle = item.querySelector(".day-title");
        if (dayTitle) {
            dayTitle.innerHTML = `<i class="fas fa-calendar-day text-primary me-2"></i>Ngày ${dayNumber}`;
        }

        const dayNumberInput = item.querySelector(".day-number-input");
        if (dayNumberInput) {
            dayNumberInput.name = `days[${index}][day_number]`;
            dayNumberInput.value = String(dayNumber);
        }

        const descEl = item.querySelector(".day-description-textarea");
        if (descEl) {
            descEl.name = `days[${index}][description]`;
        }
    });
}

function bindItineraryForm() {
    const form = document.getElementById("itinerary-form");
    if (!form || form.dataset.bound === "true") return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        updateDayInputs();

        const tourId = Number(form.elements.tour_id ? form.elements.tour_id.value : NaN);
        if (!Number.isFinite(tourId)) {
            return;
        }

        const payload = collectItineraryPayload();
        if (payload.days.length === 0) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        setSubmitButtonState(submitBtn, { disabled: true, text: "Đang lưu..." });

        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch(`${ITINERARY_API_URL}/${tourId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await parseJsonSafe(res);
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data, `Lưu lịch trình thất bại (HTTP ${res.status})`));
            }

            hideModalById("itineraryModal");
            await fetchAndRenderItineraryTours();
        } catch (error) {
        } finally {
            setSubmitButtonState(submitBtn, { disabled: false, text: "Lưu Lịch Trình" });
        }
    });

    form.dataset.bound = "true";
}

function bindDeleteAllItineraryButton() {
    const deleteAllBtn = document.getElementById("delete-all-itinerary-btn");
    if (!deleteAllBtn || deleteAllBtn.dataset.bound === "true") return;

    deleteAllBtn.addEventListener("click", () => {
        const tourId = Number(deleteAllBtn.dataset.tourId || NaN);
        if (!Number.isFinite(tourId)) {
            return;
        }

        pendingDeleteAllTourId = tourId;
        const confirmModalEl = document.getElementById("deleteAllItineraryModal");
        if (!confirmModalEl) return;

        setItineraryModalDimState(true);
        const confirmModal = bootstrap.Modal.getOrCreateInstance(confirmModalEl);
        confirmModal.show();
    });

    deleteAllBtn.dataset.bound = "true";
}

function bindDeleteAllItineraryConfirmButton() {
    const confirmBtn = document.getElementById("confirm-delete-all-itinerary");
    const confirmModalEl = document.getElementById("deleteAllItineraryModal");
    if (!confirmBtn || !confirmModalEl || confirmBtn.dataset.bound === "true") return;

    confirmBtn.addEventListener("click", async () => {
        if (!Number.isFinite(pendingDeleteAllTourId)) {
            return;
        }

        confirmBtn.disabled = true;

        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch(`${ITINERARY_API_URL}/${pendingDeleteAllTourId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await parseJsonSafe(res);
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data, `Xóa lịch trình thất bại (HTTP ${res.status})`));
            }

            const confirmModal = bootstrap.Modal.getOrCreateInstance(confirmModalEl);
            confirmModal.hide();
            hideModalById("itineraryModal");
            await fetchAndRenderItineraryTours();
        } catch (error) {
            window.alert(error.message || "Không thể xóa toàn bộ lịch trình.");
        } finally {
            confirmBtn.disabled = false;
        }
    });

    confirmModalEl.addEventListener("hidden.bs.modal", () => {
        pendingDeleteAllTourId = NaN;
        setItineraryModalDimState(false);
    });

    confirmBtn.dataset.bound = "true";
}

function collectItineraryPayload() {
    const container = document.getElementById("itinerary-days-container");
    if (!container) return { days: [] };

    const days = [];
    container.querySelectorAll(".itinerary-day-item").forEach((item, index) => {
        const descEl = item.querySelector(".day-description-textarea");
        const description = String(descEl ? descEl.value : "").trim();
        if (!description) return;

        days.push({
            day_number: index + 1,
            description,
        });
    });

    return { days };
}

function bindItineraryModalReset() {
    const modalEl = document.getElementById("itineraryModal");
    const form = document.getElementById("itinerary-form");
    const deleteAllBtn = document.getElementById("delete-all-itinerary-btn");
    if (!modalEl || !form || modalEl.dataset.boundReset === "true") return;

    modalEl.addEventListener("hidden.bs.modal", () => {
        setItineraryModalDimState(false);
        form.reset();
        if (form.elements.tour_id) {
            form.elements.tour_id.value = "";
        }
        if (deleteAllBtn) {
            deleteAllBtn.dataset.tourId = "";
            deleteAllBtn.dataset.tourName = "";
            deleteAllBtn.disabled = true;
        }
        renderItineraryDays([]);
    });

    modalEl.dataset.boundReset = "true";
}

function setItineraryModalDimState(isDimmed) {
    const itineraryModalEl = document.getElementById("itineraryModal");
    if (!itineraryModalEl) return;

    const modalContent = itineraryModalEl.querySelector(".modal-content");
    if (!modalContent) return;

    modalContent.style.transition = "filter 0.2s ease";

    if (isDimmed) {
        modalContent.style.filter = "brightness(35%)";
    } else {
        modalContent.style.filter = "";
    }
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

window.initAdminItineraryPage = initAdminItineraryPage;
