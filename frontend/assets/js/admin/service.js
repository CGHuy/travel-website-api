window.initAdminServicePage = async function () {
    const searchInput = document.getElementById("service-search-input");
    const searchBtn = document.getElementById("service-search-btn");
    const tableBody = document.getElementById("service-table-body");
    const addServiceBtn = document.querySelector('[data-bs-target="#addServiceModal"]');
    const addServiceModal = document.getElementById("addServiceModal");
    const editServiceModal = document.getElementById("editServiceModal");
    const deleteServiceModal = document.getElementById("deleteServiceModal");
    const totalCountEl = document.getElementById("service-total-count");

    if (!tableBody) return;

    function updateServiceTotalCount(total) {
        if (totalCountEl) {
            totalCountEl.textContent = String(total);
        }
    }

    // Load dữ liệu dịch vụ từ API
    async function updateServiceTotal(count) {
        if (totalCountEl) {
            totalCountEl.textContent = count;
        }
    }

    async function loadServices() {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">Đang tải danh sách dịch vụ...</td></tr>';
        try {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                updateServiceTotalCount(0);
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger p-4">Vui lòng đăng nhập quyền Admin.</td></tr>';
                return;
            }

            const res = await fetch("/api/services", {
                headers: { Authorization: "Bearer " + token },
            });

            if (!res.ok) throw new Error("HTTP " + res.status);

            const data = await res.json();
            const services = (data.data || []).slice().sort((a, b) => Number(a.id) - Number(b.id));
            updateServiceTotal(services.length);

            if (services.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">Không có dịch vụ nào.</td></tr>';
                return;
            }

            tableBody.innerHTML = "";
            for (const service of services) {
                const tr = document.createElement("tr");
                const desc = service.description || "";
                const shortDesc = desc.length > 50 ? desc.substring(0, 50) + "..." : desc;

                const statusBadge = (service.status || 0) == 1 ? '<span class="badge bg-success">Hoạt động</span>' : '<span class="badge bg-secondary">Ngưng</span>';

                tr.innerHTML = `
                    <td class="find_id">SVC${String(service.id).padStart(3, "0")}</td>
                    <td class="find_name">${escapeHtml(service.name)}</td>
                    <td>${escapeHtml(shortDesc)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary edit-service-btn" data-id="${service.id}">
                            <i class="fa-solid fa-pen-to-square me-1"></i> Sửa
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-service-btn" 
                            data-id="${service.id}" data-name="${escapeHtml(service.name)}">
                            <i class="fa-solid fa-trash me-1"></i> Xóa
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);

                // Sửa dịch vụ
                tr.querySelector(".edit-service-btn").addEventListener("click", async () => {
                    await loadEditServiceForm(service.id);
                });

                // Xóa dịch vụ
                tr.querySelector(".delete-service-btn").addEventListener("click", function (event) {
                    event.preventDefault();
                    const id = this.dataset.id;
                    const name = this.dataset.name || "";
                    const hiddenInput = document.getElementById("delete_service_id");
                    const nameEl = document.getElementById("delete_service_name");
                    if (hiddenInput) hiddenInput.value = id;
                    if (nameEl) nameEl.textContent = name;
                    if (deleteServiceModal) {
                        bootstrap.Modal.getOrCreateInstance(deleteServiceModal).show();
                    }
                });
            }
        } catch (err) {
            console.error("Lỗi load services", err);
            updateServiceTotal(0);
            tableBody.innerHTML =
                '<tr><td colspan="5" class="text-center text-danger p-4">Lỗi khi tải danh sách. Kiểm tra server.</td></tr>';
        }
    }

    // Tạo HTML form thêm / sửa dịch vụ
    function renderServiceForm({ id = null, name = "", slug = "", description = "", status = 1, submitLabel = "Lưu", submitClass = "btn-primary" } = {}) {
        return `
            <form id="service-form">
                <div class="mb-3">
                    <label for="service-name" class="form-label">Tên Dịch vụ <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="service-name" name="name" value="${escapeHtml(name)}" required />
                </div>

                <div class="mb-3">
                    <label for="service-slug" class="form-label">Slug</label>
                    <input type="text" class="form-control" id="service-slug" name="slug" value="${escapeHtml(slug)}" />
                    <div class="form-text">Tự sinh từ tên hoặc chỉnh tay.</div>
                </div>

                <div class="mb-3">
                    <label for="service-description" class="form-label">Mô tả</label>
                    <textarea class="form-control" id="service-description" name="description" rows="4">${escapeHtml(description)}</textarea>
                </div>

                <div class="mb-3 form-check">
                    <input type="hidden" name="status" value="0" />
                    <input type="checkbox" name="status" id="service-status" class="form-check-input" value="1" ${status == 1 ? "checked" : ""} />
                    <label class="form-check-label" for="service-status">Hoạt động</label>
                </div>

                <div class="alert alert-danger d-none" id="service-form-error"></div>

                <div class="modal-footer p-3 pb-1">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn ${submitClass}">${submitLabel}</button>
                </div>
            </form>
        `;
    }

    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    function buildSlugCandidate(baseSlug, attempt) {
        return attempt <= 1 ? baseSlug : `${baseSlug}-${attempt}`;
    }

    function isDuplicateSlugError(message) {
        return typeof message === "string" && /duplicate entry/i.test(message);
    }

    function getFriendlyErrorMessage(message) {
        if (isDuplicateSlugError(message)) {
            return "Slug đã tồn tại. Vui lòng dùng slug khác hoặc sửa tên dịch vụ.";
        }
        return message;
    }

    // Load form thêm dịch vụ
    async function loadAddServiceForm() {
        const modalBody = addServiceModal.querySelector(".modal-body");
        modalBody.innerHTML = renderServiceForm({ submitLabel: "Thêm", submitClass: "btn-primary" });

        const form = modalBody.querySelector("#service-form");
        const nameInput = form.querySelector("#service-name");
        const slugInput = form.querySelector("#service-slug");
        const errorEl = form.querySelector("#service-form-error");
        let slugEdited = false;
        let baseSlug = slugify(nameInput.value);

        nameInput.addEventListener("input", () => {
            if (!slugEdited) {
                baseSlug = slugify(nameInput.value);
                slugInput.value = baseSlug;
            }
        });

        slugInput.addEventListener("input", () => {
            slugEdited = true;
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            errorEl.classList.add("d-none");
            let payload = {
                name: nameInput.value.trim(),
                slug: slugInput.value.trim() || slugify(nameInput.value),
                description: form.querySelector("#service-description").value.trim(),
                status: form.querySelector("#service-status").checked ? 1 : 0,
            };

            if (!payload.name || !payload.slug) {
                errorEl.textContent = "Tên và slug là bắt buộc.";
                errorEl.classList.remove("d-none");
                return;
            }

            let attempt = 1;
            while (true) {
                try {
                    const token = localStorage.getItem("token") || "";
                    const res = await fetch("/api/services", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: token ? "Bearer " + token : "",
                        },
                        body: JSON.stringify(payload),
                    });

                    const data = await res.json().catch(() => null);
                    if (res.ok && data && data.success) {
                        bootstrap.Modal.getInstance(addServiceModal)?.hide();
                        await loadServices();
                        return;
                    }

                    const message = (data && data.message) || "Tạo dịch vụ thất bại.";
                    if (isDuplicateSlugError(message) && !slugEdited) {
                        attempt += 1;
                        payload.slug = buildSlugCandidate(baseSlug, attempt);
                        slugInput.value = payload.slug;
                        continue;
                    }

                    throw new Error(getFriendlyErrorMessage(message));
                } catch (err) {
                    console.error(err);
                    errorEl.textContent = err.message || "Lỗi khi tạo dịch vụ.";
                    errorEl.classList.remove("d-none");
                    return;
                }
            }
        });
    }

    // Load form sửa dịch vụ
    async function loadEditServiceForm(id) {
        const modalBody = editServiceModal.querySelector(".modal-body");
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Đang tải dữ liệu dịch vụ...</p>
            </div>
        `;

        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch(`/api/services/${id}`, {
                headers: {
                    Authorization: token ? "Bearer " + token : "",
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || "Không thể tải dịch vụ.");
            }

            const service = data.data;
            modalBody.innerHTML = renderServiceForm({
                id: service.id,
                name: service.name,
                slug: service.slug || "",
                description: service.description || "",
                status: service.status || 0,
                submitLabel: "Lưu",
                submitClass: "btn-primary",
            });

            const form = modalBody.querySelector("#service-form");
            const nameInput = form.querySelector("#service-name");
            const slugInput = form.querySelector("#service-slug");
            const errorEl = form.querySelector("#service-form-error");
            let slugEdited = Boolean(service.slug);

            nameInput.addEventListener("input", () => {
                if (!slugEdited) {
                    slugInput.value = slugify(nameInput.value);
                }
            });

            slugInput.addEventListener("input", () => {
                slugEdited = true;
            });

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                errorEl.classList.add("d-none");
                const payload = {
                    name: nameInput.value.trim(),
                    slug: slugInput.value.trim() || slugify(nameInput.value),
                    description: form.querySelector("#service-description").value.trim(),
                    status: form.querySelector("#service-status").checked ? 1 : 0,
                };

                if (!payload.name || !payload.slug) {
                    errorEl.textContent = "Tên và slug là bắt buộc.";
                    errorEl.classList.remove("d-none");
                    return;
                }

                try {
                    const token = localStorage.getItem("token") || "";
                    const updateRes = await fetch(`/api/services/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: token ? "Bearer " + token : "",
                        },
                        body: JSON.stringify(payload),
                    });

                    const updateData = await updateRes.json().catch(() => null);
                    if (!updateRes.ok || !(updateData && updateData.success)) {
                        const message = (updateData && updateData.message) || "Cập nhật dịch vụ thất bại.";
                        throw new Error(getFriendlyErrorMessage(message));
                    }

                    bootstrap.Modal.getInstance(editServiceModal)?.hide();
                    await loadServices();
                } catch (err) {
                    console.error(err);
                    errorEl.textContent = err.message || "Lỗi khi cập nhật dịch vụ.";
                    errorEl.classList.remove("d-none");
                }
            });

            bootstrap.Modal.getOrCreateInstance(editServiceModal).show();
        } catch (err) {
            console.error(err);
            modalBody.innerHTML = '<div class="alert alert-danger">Lỗi khi tải dịch vụ. Kiểm tra server.</div>';
        }
    }

    // Hàm escape HTML
    function escapeHtml(text) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    // Search dịch vụ
    function handleSearch() {
        if (!searchInput || !tableBody) return;
        const q = searchInput.value.trim().toLowerCase();
        const rows = tableBody.querySelectorAll("tr");
        let visibleCount = 0;
        rows.forEach((row) => {
            // Chỉ lọc các hàng chứa dữ liệu, bỏ qua hàng thông báo "Đang tải" hoặc "Không có dữ liệu"
            if (row.cells.length < 5) return; 
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(q);
            row.style.display = isVisible ? "" : "none";
            if (isVisible) visibleCount++;
        });
        updateServiceTotal(visibleCount);
    }

    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }
    if (searchBtn) {
        searchBtn.addEventListener("click", handleSearch);
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => {
            const q = searchInput.value.trim().toLowerCase();
            const rows = tableBody.querySelectorAll("tr");
            rows.forEach((row) => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(q) ? "" : "none";
            });
        });
    }

    // Load form thêm dịch vụ khi click nút
    if (addServiceBtn) {
        addServiceBtn.addEventListener("click", loadAddServiceForm);
    }

    // Load form sửa dịch vụ khi click nút trong modal
    if (editServiceModal) {
        editServiceModal.addEventListener("show.bs.modal", function (e) {
            const btn = e.relatedTarget;
            if (btn && btn.dataset.id) {
                loadEditServiceForm(btn.dataset.id);
            }
        });
    }

    // Prepare delete modal when opened
    // Optionally update delete modal when it is shown.
    // We already set values manually on button click, but this keeps behavior consistent.
    if (deleteServiceModal) {
        deleteServiceModal.addEventListener("show.bs.modal", function (e) {
            const btn = e.relatedTarget;
            if (!btn) return;
            const id = btn.dataset.id;
            const name = btn.dataset.name || "";
            const hiddenInput = document.getElementById("delete_service_id");
            const nameEl = document.getElementById("delete_service_name");
            if (hiddenInput) hiddenInput.value = id;
            if (nameEl) nameEl.textContent = name;
        });
    }

    // Xử lý xóa dịch vụ
    const deleteForm = document.querySelector("#deleteServiceModal form");
    if (deleteForm) {
        deleteForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("delete_service_id").value;
            const token = localStorage.getItem("token");

            if (!id) {
                alert("Không xác định được service cần xóa.");
                return;
            }

            try {
                const res = await fetch(`/api/services/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: "Bearer " + token },
                });
                const data = await res.json().catch(() => null);

                if (res.ok && data && data.success) {
                    bootstrap.Modal.getInstance(deleteServiceModal).hide();
                    await loadServices();
                } else {
                    const message = data && data.message ? data.message : "Lỗi khi xóa dịch vụ";
                    alert(message);
                }
            } catch (err) {
                console.error(err);
                alert("Lỗi kết nối server");
            }
        });
    }

    // Tải danh sách dịch vụ khi trang được load
    await loadServices();

    // Reload dữ liệu khi modal thêm/sửa đóng
    addServiceModal.addEventListener("hidden.bs.modal", async () => {
        await loadServices();
    });

    editServiceModal.addEventListener("hidden.bs.modal", async () => {
        await loadServices();
    });
};
