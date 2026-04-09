// File: frontend/assets/js/admin-booking.js

window.initAdminBookingPage = async function () {
    const bodyEl = document.getElementById("booking-list-body");
    const totalEl = document.getElementById("booking-total-count");
    const searchInput = document.getElementById("booking-search-input");
    const refreshBtn = document.getElementById("refresh-bookings");

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

    async function deleteBooking(id) {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
            });
            if (res.ok) {
                await loadBookings();
            } else {
                alert("Lỗi khi xóa booking");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối server");
        }
    }

    async function loadBookings() {
        bodyEl.innerHTML =
            '<tr><td colspan="7" class="text-center text-muted p-4">Đang tải danh sách booking...</td></tr>';
        try {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                bodyEl.innerHTML =
                    '<tr><td colspan="7" class="text-center text-danger p-4">Vui lòng đăng nhập quyền Admin.</td></tr>';
                return;
            }

            let res = await fetch("/api/bookings", {
                headers: { Authorization: "Bearer " + token },
            });

            if (!res.ok) throw new Error("HTTP " + res.status);

            const data = await res.json();
            const rows = data.data || [];
            totalEl.textContent = rows.length;

            if (rows.length === 0) {
                bodyEl.innerHTML =
                    '<tr><td colspan="7" class="text-center text-muted p-4">Không có booking nào.</td></tr>';
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
                    
                    // Add hover effect via CSS inline or rely on existing classes
                    trNode.classList.add("table-hover", "row-clickable");
                }

                tr.querySelector(".booking-code").textContent =
                    "BOK" + String(r.id).padStart(4, "0");
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
                    statusEl.textContent = "Chờ xử lý";
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
        } catch (err) {
            console.error("Lỗi load bookings", err);
            bodyEl.innerHTML =
                '<tr><td colspan="7" class="text-center text-danger p-4">Lỗi khi tải danh sách. Kiểm tra server.</td></tr>';
            totalEl.textContent = "0";
        }
    }

    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        const rows = bodyEl.querySelectorAll("tr");
        rows.forEach((row) => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? "" : "none";
        });
    });

    refreshBtn.addEventListener("click", loadBookings);

    await loadBookings();
};
