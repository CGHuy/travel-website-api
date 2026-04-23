window.initAdminDeparturePage = async function () {
    const departureList = document.getElementById("departureList");
    const searchInput = document.getElementById("searchDepartureInput");
    const searchBtn = document.getElementById("searchDepartureBtn");

    let currentDeparturesList = []; // Global state

    let actionToastEl = document.getElementById("actionToast");
    let actionToast = actionToastEl ? new bootstrap.Toast(actionToastEl, { delay: 3000 }) : null;

    function showToast(message, type = "success") {
        if (!actionToast) return alert(message);
        const toastBody = document.getElementById("actionToastBody");
        toastBody.textContent = message;

        actionToastEl.classList.remove("bg-success", "bg-danger", "bg-warning", "bg-info", "text-white");
        actionToastEl.classList.add(`bg-${type}`, "text-white");

        actionToast.show();
    }

    const addDepartureModal = new bootstrap.Modal(document.getElementById("addDepartureModal") || document.createElement("div"));

    document.getElementById("saveAddDepartureBtn")?.addEventListener("click", async () => {
        const tour_id = document.getElementById("addTourId").value;
        const departure_date = document.getElementById("addDepartureDate").value;
        const departure_location = document.getElementById("addDepartureLocation").value.trim();
        const price_moving = document.getElementById("addPriceMoving").value;
        const price_moving_child = document.getElementById("addPriceMovingChild").value;
        const seats_total = document.getElementById("addSeatsTotal").value;

        if (!tour_id || !departure_date || !departure_location || !price_moving || !price_moving_child || !seats_total) {
            showToast("Vui lòng nhập đầy đủ các trường bắt buộc!", "warning");
            return;
        }

        const payload = {
            tour_id: Number(tour_id),
            departure_date: departure_date,
            departure_location: departure_location,
            price_moving: Number(price_moving),
            price_moving_child: Number(price_moving_child),
            seats_total: Number(seats_total),
        };

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("/api/departures", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (result.success) {
                showToast("Thêm điểm khởi hành thành công!", "success");
                addDepartureModal.hide();
                document.getElementById("addDepartureForm").reset();
                await fetchDepartures();
            } else {
                showToast(result.message || "Có lỗi xảy ra khi thêm mới.", "danger");
            }
        } catch (error) {
            console.error("Lỗi khi thêm mới:", error);
            showToast("Lỗi kết nối tới máy chủ.", "danger");
        }
    });

    // Hàm format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
    }

    // Hàm format date (từ YYYY-MM-DDTHH:mm... -> DD/MM/YYYY)
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const hasTimezone = /z$/i.test(dateStr) || /[+-]\d{2}:\d{2}$/.test(dateStr);
        const d = (hasTimezone ? date.getUTCDate() : date.getDate()).toString().padStart(2, "0");
        const m = (hasTimezone ? date.getUTCMonth() + 1 : date.getMonth() + 1).toString().padStart(2, "0");
        const y = hasTimezone ? date.getUTCFullYear() : date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    function formatDateForInput(dateStr) {
        if (!dateStr) return "";
        // Preserve API date part to avoid timezone shift in date input.
        if (typeof dateStr === "string" && dateStr.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return dateStr.slice(0, 10);
        }
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return "";
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
    }

    function normalizeDeparture(item) {
        return {
            id: Number(item?.id ?? item?.departure_id ?? 0),
            tour_id: Number(item?.tour_id ?? item?.tourId ?? 0),
            departure_location: String(item?.departure_location ?? item?.location ?? ""),
            departure_date: item?.departure_date ?? item?.date ?? "",
            price_moving: Number(item?.price_moving ?? item?.priceMoving ?? 0),
            price_moving_child: Number(item?.price_moving_child ?? item?.priceMovingChild ?? 0),
            seats_total: Number(item?.seats_total ?? item?.seatsTotal ?? 0),
            seats_available: Number(item?.seats_available ?? item?.seatsAvailable ?? 0),
            status: String(item?.status ?? "open"),
            created_at: item?.created_at,
            updated_at: item?.updated_at,
        };
    }

    function normalizeDepartureList(data) {
        const list = Array.isArray(data) ? data : data ? [data] : [];
        return list.map(normalizeDeparture);
    }

    // Lấy danh sách departures
    async function fetchDepartures() {
        try {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                departureList.innerHTML = `<div style="text-align: center; color: #dc2626;">Bạn cần đăng nhập để xem danh sách điểm khởi hành.</div>`;
                return;
            }

            const response = await fetch("/api/departures/all", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                currentDeparturesList = normalizeDepartureList(result.data);
                renderDepartures(currentDeparturesList);
            } else {
                departureList.innerHTML = `<div style="text-align: center; color: #dc2626;">Lỗi: ${result.message || "Không thể tải dữ liệu"}</div>`;
            }
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            departureList.innerHTML = `<div style="text-align: center; color: #dc2626;">Đã xảy ra lỗi kết nối với máy chủ.</div>`;
        }
    }

    // Hiển thị dữ liệu ra HTML
    function renderDepartures(departures) {
        departureList.innerHTML = ""; // Clear placeholder

        // Update total badge if it exists
        const badgeTotal = document.querySelector(".badge-total");
        if (badgeTotal) {
            badgeTotal.innerText = `Tổng: ${Array.isArray(departures) ? departures.length : 0} điểm khởi hành`;
        }

        if (!Array.isArray(departures) || departures.length === 0) {
            departureList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #6b7280;">Không có điểm khởi hành nào.</div>`;
            return;
        }

        departures.forEach((dep) => {
            // Formatting data
            const price = formatCurrency(Number(dep.price_moving) || 0);
            const priceChild = formatCurrency(Number(dep.price_moving_child) || 0);
            const date = dep.departure_date ? formatDate(dep.departure_date) : "-";

            const seatsTotal = Number(dep.seats_total) || 0;
            const seatsAvailable = Math.max(0, Number(dep.seats_available) || 0);
            const availableRatio = seatsTotal > 0 ? seatsAvailable / seatsTotal : 0;

            // Trạng thái (status)
            let statusClass = "status-open";
            let statusText = "Mở";
            if (dep.status === "closed") {
                statusClass = "status-closed";
                statusText = "Đóng";
            } else if (dep.status === "full" || seatsAvailable <= 0) {
                statusClass = "status-full";
                statusText = "Đầy";
            }

            let seatsColorClass = "";
            if (seatsAvailable <= 0) {
                seatsColorClass = "full";
            } else if (availableRatio <= 0.2) {
                seatsColorClass = "almost-full";
            }

            const cardHtml = `
				<div class="departure-card">
					<div class="card-top">
						<div class="card-title-area">
							<div class="tour-name-group">
                                <h3 class="tour-name">Tour ID: ${String(dep.tour_id || "")}</h3>
								<span class="status-badge ${statusClass}" style="cursor:pointer;" onclick="window.quickEditStatus(${dep.id})" title="Nhấn để đổi trạng thái">${statusText}</span>
							</div>
							<span class="tour-code">Mã: DEP${dep.id.toString().padStart(3, "0")}</span>
						</div>
						<div class="card-actions">
							<button class="action-btn btn-edit" title="Sửa" onclick="window.openEditDepartureModal(${dep.id})"><i class="fa-solid fa-pen-to-square"></i></button>
							<button class="action-btn btn-delete" title="Xóa" onclick="window.deleteDeparture(${dep.id})"><i class="fa-solid fa-trash-can"></i></button>
						</div>
					</div>
					<div class="card-details">
						<div class="detail-item">
							<i class="fa-solid fa-plane-departure"></i>
							<span>Địa điểm: <strong>${dep.departure_location}</strong></span>
						</div>
						<div class="detail-item">
							<i class="fa-regular fa-calendar-days"></i>
							<span>Ngày: <strong>${date}</strong></span>
						</div>
						<div class="detail-item" style="cursor: pointer;" onclick="window.quickEditPrice(${dep.id})" title="Nhấn để đổi giá">
							<i class="fa-solid fa-tag"></i>
							<span>Giá: <strong>${price}</strong> <i class="fa-solid fa-pen" style="font-size: 0.75rem; color: #3b82f6; margin-left: 2px;"></i></span>
						</div>
						<div class="detail-item" style="cursor: pointer;" onclick="window.quickEditPrice(${dep.id})" title="Nhấn để đổi giá">
							<i class="fa-solid fa-child"></i>
							<span>Giá trẻ em: <strong>${priceChild}</strong> <i class="fa-solid fa-pen" style="font-size: 0.75rem; color: #3b82f6; margin-left: 2px;"></i></span>
						</div>
						<div class="detail-item seats-indicator" style="cursor: pointer;" onclick="window.quickEditSeats(${dep.id})" title="Nhấn để đổi lượng chỗ trống">
							<i class="fa-solid fa-users"></i>
                            <span>Còn trống: <strong class="seats-text ${seatsColorClass}">${seatsAvailable}/${seatsTotal}</strong> <i class="fa-solid fa-pen" style="font-size: 0.75rem; color: #3b82f6; margin-left: 2px;"></i></span>
						</div>
					</div>
				</div>
			`;

            departureList.insertAdjacentHTML("beforeend", cardHtml);
        });
    }

    // Search logic
    async function doSearchDeparture(query) {
        departureList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #6b7280;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm...</div>`;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            let apiUrl = `/api/departures/search`;
            if (query) {
                // Simple heuristic matching
                if (!isNaN(query) && query.length < 5) {
                    apiUrl += `?id=${query}`;
                } else if (["open", "closed", "full"].includes(query.toLowerCase())) {
                    apiUrl += `?status=${query.toLowerCase()}`;
                } else {
                    apiUrl += `?departure_location=${encodeURIComponent(query)}`;
                } // To make it robust: API searches only one condition here.
            } else {
                apiUrl = `/api/departures/all`;
            }

            const response = await fetch(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();

            if (result.success) {
                currentDeparturesList = normalizeDepartureList(result.data);
                renderDepartures(currentDeparturesList);
            } else {
                departureList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #6b7280;">Không tìm thấy điểm khởi hành nào khớp.</div>`;
            }
        } catch (error) {
            console.error(error);
            departureList.innerHTML = `<div style="text-align: center; color: #dc2626;">Lỗi khi tìm kiếm.</div>`;
        }
    }

    searchBtn?.addEventListener("click", () => {
        doSearchDeparture(searchInput.value.trim());
    });

    searchInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            doSearchDeparture(searchInput.value.trim());
        }
    });

    // Edit Modal Logic
    const editDepartureModal = new bootstrap.Modal(document.getElementById("editDepartureModal") || document.createElement("div"));

    window.openEditDepartureModal = function (id) {
        const dep = currentDeparturesList.find((d) => d.id === id);
        if (!dep) return;

        document.getElementById("editDepId").value = dep.id;
        document.getElementById("editDepTourId").value = dep.tour_id;

        // Format date YYYY-MM-DD for input
        const formattedDate = formatDateForInput(dep.departure_date);
        document.getElementById("editDepDate").value = formattedDate;
        document.getElementById("editDepLocation").value = dep.departure_location;
        document.getElementById("editDepPrice").value = dep.price_moving;
        document.getElementById("editDepPriceChild").value = dep.price_moving_child;
        document.getElementById("editDepSeatsTotal").value = dep.seats_total;
        document.getElementById("editDepSeatsAvail").value = dep.seats_available;

        editDepartureModal.show();
    };

    document.getElementById("saveEditDepartureBtn")?.addEventListener("click", async () => {
        const id = document.getElementById("editDepId").value;
        const tourId = Number(document.getElementById("editDepTourId").value);
        const departureDate = document.getElementById("editDepDate").value;
        const departureLocation = document.getElementById("editDepLocation").value.trim();
        const priceMoving = Number(document.getElementById("editDepPrice").value);
        const priceMovingChild = Number(document.getElementById("editDepPriceChild").value);
        const seatsTotal = Number(document.getElementById("editDepSeatsTotal").value);
        const seatsAvailable = Number(document.getElementById("editDepSeatsAvail").value);

        if (!id || !tourId || !departureDate || !departureLocation) {
            showToast("Vui lòng nhập đầy đủ thông tin bắt buộc.", "warning");
            return;
        }
        if ([priceMoving, priceMovingChild, seatsTotal, seatsAvailable].some((value) => Number.isNaN(value) || value < 0)) {
            showToast("Giá và số ghế phải là số hợp lệ, không âm.", "warning");
            return;
        }
        if (seatsAvailable > seatsTotal) {
            showToast("Số chỗ còn trống không được lớn hơn tổng số chỗ.", "warning");
            return;
        }

        const payload = {
            tour_id: tourId,
            departure_date: departureDate,
            departure_location: departureLocation,
            price_moving: priceMoving,
            price_moving_child: priceMovingChild,
            seats_total: seatsTotal,
            seats_available: seatsAvailable,
        };

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`/api/departures/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (result.success) {
                showToast("Cập nhật điểm khởi hành thành công!", "success");
                editDepartureModal.hide();

                const currentQuery = searchInput.value.trim();
                if (currentQuery) await doSearchDeparture(currentQuery);
                else await fetchDepartures();
            } else {
                showToast(result.message || "Có lỗi xảy ra", "danger");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối máy chủ", "danger");
        }
    });

    // Delete Logic
    window.deleteDeparture = async function (id) {
        const dep = currentDeparturesList.find((d) => d.id === id);
        if (!dep) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa điểm khởi hành mã DEP${id.toString().padStart(5, "0")} (Tour #${dep.tour_id}) không?`)) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`/api/departures/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();

            if (result.success) {
                showToast("Xóa điểm khởi hành thành công!", "success");
                const currentQuery = searchInput.value.trim();
                if (currentQuery) await doSearchDeparture(currentQuery);
                else await fetchDepartures();
            } else {
                showToast(result.message || "Lỗi: Không được phép xóa", "danger");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi máy chủ", "danger");
        }
    };

    // --- QUICK EDIT LOGIC ---
    const quickPriceModal = new bootstrap.Modal(document.getElementById("quickPriceModal") || document.createElement("div"));
    const quickStatusModal = new bootstrap.Modal(document.getElementById("quickStatusModal") || document.createElement("div"));
    const quickSeatsModal = new bootstrap.Modal(document.getElementById("quickSeatsModal") || document.createElement("div"));

    window.quickEditPrice = function (id) {
        const dep = currentDeparturesList.find((d) => d.id === id);
        if (!dep) return;
        document.getElementById("quickPriceId").value = id;
        document.getElementById("quickPriceAdult").value = dep.price_moving;
        document.getElementById("quickPriceChild").value = dep.price_moving_child;
        quickPriceModal.show();
    };

    window.quickEditStatus = function (id) {
        const dep = currentDeparturesList.find((d) => d.id === id);
        if (!dep) return;
        document.getElementById("quickStatusId").value = id;
        document.getElementById("quickStatusSelect").value = dep.status || "open";
        quickStatusModal.show();
    };

    window.quickEditSeats = function (id) {
        const dep = currentDeparturesList.find((d) => d.id === id);
        if (!dep) return;
        document.getElementById("quickSeatsId").value = id;
        document.getElementById("quickSeatsTotal").value = dep.seats_total;
        document.getElementById("quickSeatsCurrentAvailable").value = dep.seats_available;
        document.getElementById("quickSeatsAvailable").value = dep.seats_available;
        quickSeatsModal.show();
    };

    async function doQuickUpdate(url, payload, modalInstance) {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (result.success) {
                showToast("Cập nhật nhanh thành công!", "success");
                if (modalInstance) modalInstance.hide();
                const currentQuery = searchInput.value.trim();
                if (currentQuery) await doSearchDeparture(currentQuery);
                else await fetchDepartures();
            } else {
                showToast(result.message || "Có lỗi xảy ra", "danger");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối máy chủ", "danger");
        }
    }

    document.getElementById("saveQuickPriceBtn")?.addEventListener("click", () => {
        const id = document.getElementById("quickPriceId").value;
        const pm = Number(document.getElementById("quickPriceAdult").value);
        const pmc = Number(document.getElementById("quickPriceChild").value);
        doQuickUpdate(`/api/departures/${id}/price`, { price_moving: pm, price_moving_child: pmc }, quickPriceModal);
    });

    document.getElementById("saveQuickStatusBtn")?.addEventListener("click", () => {
        const id = document.getElementById("quickStatusId").value;
        const status = document.getElementById("quickStatusSelect").value;
        doQuickUpdate(`/api/departures/${id}/status`, { status: status }, quickStatusModal);
    });

    document.getElementById("saveQuickSeatsBtn")?.addEventListener("click", () => {
        const id = document.getElementById("quickSeatsId").value;
        const seatsTotal = Number(document.getElementById("quickSeatsTotal").value);
        const targetAvailable = Number(document.getElementById("quickSeatsAvailable").value);
        const currentAvailable = Number(document.getElementById("quickSeatsCurrentAvailable").value);

        if (Number.isNaN(targetAvailable) || targetAvailable < 0) {
            showToast("Số chỗ còn trống phải là số không âm.", "warning");
            return;
        }
        if (!Number.isNaN(seatsTotal) && targetAvailable > seatsTotal) {
            showToast("Số chỗ còn trống không được lớn hơn tổng số chỗ.", "warning");
            return;
        }

        const change = targetAvailable - currentAvailable;

        if (change === 0) return quickSeatsModal.hide();
        doQuickUpdate(`/api/departures/${id}/seats`, { seatsChange: change }, quickSeatsModal);
    });

    // Thực thi việc fetch dữ liệu
    fetchDepartures();
};
