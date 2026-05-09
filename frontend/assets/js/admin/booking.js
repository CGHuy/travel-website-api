// File: frontend/assets/js/admin-booking.js

window.initAdminBookingPage = async function () {
    const bodyEl = document.getElementById("booking-list-body");
    const totalEl = document.getElementById("booking-total-count");
    const searchInput = document.getElementById("booking-search-input");
    const refreshBtn = document.getElementById("refresh-bookings");
    const paginationEl = document.getElementById("booking-pagination");
    const rangeEl = document.getElementById("booking-range");
    const totalFilteredEl = document.getElementById("booking-total-filtered");
    const statusFilter = document.getElementById("booking-status-filter");

    let currentPage = 1;
    const limit = 10;
    let currentStatus = "all";
    let currentSearch = "";
    let searchTimeout = null;

    if (!bodyEl) return;

    function formatCurrency(v) {
        try {
            return new Intl.NumberFormat("vi-VN").format(Number(v)) + " đ";
        } catch (e) {
            return v;
        }
    }

    function formatDateTime(s) {
        if (!s) return "---";
        const d = new Date(s);
        return (
            d.toLocaleDateString("vi-VN") +
            (isNaN(d.getHours())
                ? ""
                : " " +
                  d.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                  }))
        );
    }

    async function updateBookingStatus(id, updates) {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/api/bookings/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                await loadBookings();
            } else {
                const err = await res.json();
                alert("Lỗi: " + (err.message || "Không thể cập nhật"));
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối server");
        }
    }

   

    async function loadBookings(page = 1, status = currentStatus, search = currentSearch) {
        currentPage = page;
        currentStatus = status;
        currentSearch = search;
        
        bodyEl.innerHTML =
            '<tr><td colspan="7" class="text-center text-muted p-4">Đang tải danh sách booking...</td></tr>';
        try {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                bodyEl.innerHTML =
                    '<tr><td colspan="7" class="text-center text-danger p-4">Vui lòng đăng nhập quyền Admin.</td></tr>';
                return;
            }

            let res = await fetch(`/api/bookings?page=${page}&limit=${limit}&status=${status}&search=${encodeURIComponent(search)}`, {
                headers: { Authorization: "Bearer " + token },
            });

            if (!res.ok) throw new Error("HTTP " + res.status);

            const result = await res.json();
            const rows = result.data || [];
            const pagination = result.pagination || { totalItems: 0, totalPages: 0 };

            totalEl.textContent = pagination.totalItems;
            totalFilteredEl.textContent = pagination.totalItems;
            
            const start = (page - 1) * limit + 1;
            const end = Math.min(page * limit, pagination.totalItems);
            rangeEl.textContent = pagination.totalItems > 0 ? `${start}-${end}` : "0-0";

            if (rows.length === 0) {
                bodyEl.innerHTML =
                    '<tr><td colspan="7" class="text-center text-muted p-4">Không có booking nào.</td></tr>';
                renderPagination(0);
                return;
            }

            const template = document.getElementById("booking-row-template");
            bodyEl.innerHTML = "";
            for (const r of rows) {
                const tr = template.content.cloneNode(true);
                const trNode = tr.querySelector("tr");

                if (trNode) {
                    trNode.style.cursor = "pointer";
                    trNode.onclick = () => {
                        const newUrl = `?page=booking-details&id=${r.id}`;
                        history.pushState({ page: 'booking-details', id: r.id }, "", newUrl);
                        window.dispatchEvent(new Event('popstate'));
                    };
                    trNode.classList.add("table-hover", "row-clickable");
                }

                tr.querySelector(".booking-code").textContent =
                    "BOK" + String(r.id).padStart(3, "0");
                tr.querySelector(".booking-customer").textContent =
                    r.fullname || r.contact_name || "N/A";
                tr.querySelector(".booking-tour").textContent = r.tour_name || "N/A";
                tr.querySelector(".booking-date").textContent = r.departure_date
                    ? new Date(r.departure_date).toLocaleDateString("vi-VN")
                    : "---";
                tr.querySelector(".booking-total").textContent = formatCurrency(
                    r.total_price,
                );

                const statusEl = tr.querySelector(".booking-status span");
                const status = r.status || "confirmed";
                
                if (status === "confirmed") {
                    statusEl.textContent = "Đã xác nhận";
                    statusEl.className = "badge bg-success";
                } else if (status === "pending") {
                    statusEl.textContent = "Yêu cầu hủy";
                    statusEl.className = "badge bg-warning text-dark";
                } else if (status === "cancelled") {
                    statusEl.textContent = "Đã hủy";
                    statusEl.className = "badge bg-danger";
                } else {
                    statusEl.textContent = status;
                    statusEl.className = "badge bg-secondary";
                }

                tr.querySelector(".booking-created").textContent = formatDateTime(
                    r.created_at,
                );

                bodyEl.appendChild(tr);
            }

            renderPagination(pagination.totalPages);

        } catch (err) {
            console.error("Lỗi load bookings", err);
            bodyEl.innerHTML =
                '<tr><td colspan="7" class="text-center text-danger p-4">Lỗi khi tải danh sách. Kiểm tra server.</td></tr>';
            totalEl.textContent = "0";
        }
    }

    function renderPagination(totalPages) {
        if (!paginationEl) return;
        paginationEl.innerHTML = "";

        if (totalPages <= 1) return;

        // Nút Previous
        const prevLi = document.createElement("li");
        prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
        if (currentPage > 1) {
            prevLi.onclick = (e) => {
                e.preventDefault();
                loadBookings(currentPage - 1);
            };
        }
        paginationEl.appendChild(prevLi);

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === currentPage ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = (e) => {
                e.preventDefault();
                if (i !== currentPage) loadBookings(i);
            };
            paginationEl.appendChild(li);
        }

        // Nút Next
        const nextLi = document.createElement("li");
        nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
        if (currentPage < totalPages) {
            nextLi.onclick = (e) => {
                e.preventDefault();
                loadBookings(currentPage + 1);
            };
        }
        paginationEl.appendChild(nextLi);
    }

    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim();
        
        // Clear timeout cũ nếu có
        if (searchTimeout) clearTimeout(searchTimeout);
        
        // Đợi 500ms sau khi người dùng ngừng gõ mới gọi API (Debounce)
        searchTimeout = setTimeout(() => {
            loadBookings(1, currentStatus, q);
        }, 500);
    });

    statusFilter.addEventListener("change", () => {
        loadBookings(1, statusFilter.value, currentSearch);
    });

    refreshBtn.addEventListener("click", () => loadBookings(1, currentStatus, currentSearch));

    await loadBookings(1, "all", "");
};
