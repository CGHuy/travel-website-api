// File: frontend/assets/js/admin-service.js

window.initAdminServicePage = async function () {
    const searchInput = document.querySelector(".search-input");
    const tableBody = document.querySelector("table tbody");
    const addServiceBtn = document.querySelector('[data-bs-target="#addServiceModal"]');
    const addServiceModal = document.getElementById("addServiceModal");
    const editServiceModal = document.getElementById("editServiceModal");
    const deleteServiceModal = document.getElementById("deleteServiceModal");

    if (!tableBody) return;

    // Load dữ liệu dịch vụ từ API
    async function loadServices() {
        tableBody.innerHTML =
            '<tr><td colspan="5" class="text-center text-muted p-4">Đang tải danh sách dịch vụ...</td></tr>';
        try {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                tableBody.innerHTML =
                    '<tr><td colspan="5" class="text-center text-danger p-4">Vui lòng đăng nhập quyền Admin.</td></tr>';
                return;
            }

            const res = await fetch("/api/services", {
                headers: { Authorization: "Bearer " + token },
            });

            if (!res.ok) throw new Error("HTTP " + res.status);

            const data = await res.json();
            const services = data.data || [];

            if (services.length === 0) {
                tableBody.innerHTML =
                    '<tr><td colspan="5" class="text-center text-muted p-4">Không có dịch vụ nào.</td></tr>';
                return;
            }

            tableBody.innerHTML = "";
            for (const service of services) {
                const tr = document.createElement("tr");
                const desc = service.description || "";
                const shortDesc = desc.length > 50 ? desc.substring(0, 50) + "..." : desc;

                const statusBadge =
                    (service.status || 0) == 1
                        ? '<span class="badge bg-success">Hoạt động</span>'
                        : '<span class="badge bg-secondary">Ngưng</span>';

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
                tr.querySelector(".delete-service-btn").addEventListener("click", function () {
                    document.getElementById("delete_service_id").value = this.dataset.id;
                    document.getElementById("delete_service_name").textContent = this.dataset.name;
                });
            }
        } catch (err) {
            console.error("Lỗi load services", err);
            tableBody.innerHTML =
                '<tr><td colspan="5" class="text-center text-danger p-4">Lỗi khi tải danh sách. Kiểm tra server.</td></tr>';
        }
    }

    // Load form thêm dịch vụ
    async function loadAddServiceForm() {
        const modalBody = addServiceModal.querySelector(".modal-body");
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Đang tải form...</p>
            </div>
        `;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/services/create", {
                headers: { Authorization: "Bearer " + token },
            });

            if (res.ok) {
                const html = await res.text();
                modalBody.innerHTML = html;
            } else {
                modalBody.innerHTML =
                    '<div class="alert alert-danger">Lỗi khi tải form. Kiểm tra server.</div>';
            }
        } catch (err) {
            console.error(err);
            modalBody.innerHTML =
                '<div class="alert alert-danger">Lỗi kết nối server.</div>';
        }
    }

    // Load form sửa dịch vụ
    async function loadEditServiceForm(id) {
        const modalBody = editServiceModal.querySelector(".modal-body");
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Đang tải form...</p>
            </div>
        `;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/services/${id}/edit`, {
                headers: { Authorization: "Bearer " + token },
            });

            if (res.ok) {
                const html = await res.text();
                modalBody.innerHTML = html;
                bootstrap.Modal.getOrCreateInstance(editServiceModal).show();
            } else {
                modalBody.innerHTML =
                    '<div class="alert alert-danger">Lỗi khi tải form. Kiểm tra server.</div>';
            }
        } catch (err) {
            console.error(err);
            modalBody.innerHTML =
                '<div class="alert alert-danger">Lỗi kết nối server.</div>';
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
    if (searchInput) {
        searchInput.addEventListener("input", () => {
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

    // Xử lý xóa dịch vụ
    const deleteForm = document.querySelector('#deleteServiceModal form');
    if (deleteForm) {
        deleteForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("delete_service_id").value;
            const token = localStorage.getItem("token");

            try {
                const res = await fetch(`/api/services/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: "Bearer " + token },
                });

                if (res.ok) {
                    bootstrap.Modal.getInstance(deleteServiceModal).hide();
                    await loadServices();
                } else {
                    alert("Lỗi khi xóa dịch vụ");
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
