// BookingTour.js - Logic for booking-tour.html
document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([loadComponent("header-placeholder", "../../components/header.html"), loadComponent("footer-placeholder", "../../components/footer.html")]);

    // 1. Get tourId from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get("tour_id");

    if (!tourId) {
        alert("Không tìm thấy thông tin tour để đặt! Quay lại trang chủ.");
        window.location.href = "/index";
        return;
    }

    // State
    let tourInfo = null;
    let departuresInfo = [];
    let baseAdultPrice = 0;
    let baseChildPrice = 0;
    let movingAdultPrice = 0;
    let movingChildPrice = 0;

    // Phase 1: Fetch Tour Data
    const fetchTourAndDepartures = async () => {
        try {
            const response = await fetch(`/api/list-tours/tour-departures/${tourId}`);
            const result = await response.json();

            if (result.success && result.data) {
                tourInfo = result.data.tour;
                departuresInfo = result.data.departures;
                renderTourSummary(tourInfo);
                renderDepartures(departuresInfo);
            } else {
                alert("Lỗi tải thông tin tour!");
            }
        } catch (error) {
            console.error("Error fetching tour info:", error);
            alert("Lỗi kết nối máy chủ!");
        }
    };

    const renderTourSummary = (tour) => {
        // Display tour info
        document.getElementById("bc-tour-name").innerText = tour.name;
        document.getElementById("tour-name-display").innerText = tour.name;
        document.getElementById("tour-code").innerText = `TOUR-${tourId.toString().padStart(3, "0")}`;
        document.getElementById("tour-img").src = tour.cover_image;
        document.getElementById("tour-duration").innerText = tour.duration;

        baseAdultPrice = parseFloat(tour.price_default);
        baseChildPrice = parseFloat(tour.price_child);

        calculateTotal();
    };

    const renderDepartures = (departures) => {
        const select = document.getElementById("departure_id");
        if (!departures || departures.length === 0) {
            select.innerHTML = '<option value="">-- Hiện chưa có lịch khởi hành --</option>';
            return;
        }

        select.innerHTML =
            '<option value="">-- Chọn lịch khởi hành phù hợp --</option>' +
            departures
                .map((d) => {
                    const date = new Date(d.departure_date).toLocaleDateString("vi-VN");
                    return `<option value="${d.id}">${date} - Khởi hành từ ${d.departure_location}</option>`;
                })
                .join("");

        // Event listener selection change
        select.addEventListener("change", (e) => {
            const selectedId = e.target.value;
            const dep = departures.find((d) => d.id == selectedId);

            const extraInfoDiv = document.getElementById("departure-info-extra");
            const avaiSeatsCount = document.getElementById("available-seats-count");
            const rowMovingAdult = document.getElementById("row-moving-adult");
            const rowMovingChild = document.getElementById("row-moving-child");
            const priceMovingAdultText = document.getElementById("price-moving-adult");
            const priceMovingChildText = document.getElementById("price-moving-child");

            if (dep) {
                movingAdultPrice = parseFloat(dep.price_moving) || 0;
                movingChildPrice = parseFloat(dep.price_moving_child) || 0;

                // Cập nhật số chỗ khả dụng
                if (avaiSeatsCount) avaiSeatsCount.innerText = dep.seats_available;
                if (extraInfoDiv) extraInfoDiv.style.display = "block";

                // Hiển thị phụ phí di chuyển
                if (priceMovingAdultText) priceMovingAdultText.innerText = `+ ${movingAdultPrice.toLocaleString("vi-VN")} ₫`;
                if (priceMovingChildText) priceMovingChildText.innerText = `+ ${movingChildPrice.toLocaleString("vi-VN")} ₫`;

                if (rowMovingAdult) rowMovingAdult.setAttribute("style", "display: flex !important;");
                if (rowMovingChild) rowMovingChild.setAttribute("style", "display: flex !important;");
            } else {
                movingAdultPrice = 0;
                movingChildPrice = 0;
                if (extraInfoDiv) extraInfoDiv.style.display = "none";
                if (rowMovingAdult) rowMovingAdult.setAttribute("style", "display: none !important;");
                if (rowMovingChild) rowMovingChild.setAttribute("style", "display: none !important;");
            }
            calculateTotal();
        });
    };

    // Phase 2: Quantity & Calculation Logic
    window.updateQty = (type, change) => {
        const input = document.getElementById(type);
        let current = parseInt(input.value);
        let newVal = current + change;

        if (type === "adults" && newVal < 1) newVal = 1;
        if (type === "children" && newVal < 0) newVal = 0;

        input.value = newVal;
        calculateTotal();
        renderPassengerFields();
    };

    const calculateTotal = () => {
        const adults = parseInt(document.getElementById("adults").value) || 0;
        const children = parseInt(document.getElementById("children").value) || 0;

        const currentAdultPrice = baseAdultPrice + movingAdultPrice;
        const currentChildPrice = baseChildPrice + movingChildPrice;

        const total = adults * currentAdultPrice + children * currentChildPrice;

        document.getElementById("price-adult").innerText = currentAdultPrice.toLocaleString("vi-VN") + " ₫";
        document.getElementById("price-child").innerText = currentChildPrice.toLocaleString("vi-VN") + " ₫";

        document.getElementById("sum-passengers").innerText = `${adults + children} người`;
        document.getElementById("total-amount").innerText = total.toLocaleString("vi-VN") + " ₫";
    };

    const renderPassengerFields = () => {
        const adults = parseInt(document.getElementById("adults").value) || 0;
        const children = parseInt(document.getElementById("children").value) || 0;
        const container = document.getElementById("passengers-container");
        const wrapper = document.getElementById("passengers-detail-wrapper");

        const totalCount = adults + children;

        if (!container || !wrapper) return;

        // Nếu chỉ có 1 người (người liên hệ), mặc định không hiện bảng này
        if (totalCount <= 1) {
            wrapper.style.display = "none";
            return;
        }

        // Hiện bảng từ người thứ 2
        wrapper.style.display = "block";
        let html = "";
        let currentIdx = 2; // Người liên hệ mặc định là Passenger 1

        // Render adult fields (trừ người đầu tiên)
        for (let i = 1; i < adults; i++) {
            html += generatePassengerRow(currentIdx++, "Người lớn", "adult");
        }

        // Render child fields
        for (let i = 0; i < children; i++) {
            html += generatePassengerRow(currentIdx++, "Trẻ em", "child");
        }

        container.innerHTML = html;
    };

    const generatePassengerRow = (index, label, type) => {
        return `
            <div class="passenger-row mb-3 p-3 rounded-4 border-1" style="background: #fcfdfe; border: 1px solid #f1f5f9;">
                <div class="row g-3 text-start">
                    <div class="col-12">
                        <span class="badge ${type === "adult" ? "bg-primary-subtle text-primary" : "bg-info-subtle text-info"} rounded-pill px-3">Hành khách ${index} (${label})</span>
                    </div>
                    <div class="col-md-5">
                        <label class="form-label small fw-bold text-secondary">Họ tên *</label>
                        <input type="text" class="form-control form-control-sm" name="ps_name_${index}" placeholder="Nhập họ tên" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small fw-bold text-secondary">Giới tính</label>
                        <select class="form-select form-select-sm" name="ps_gender_${index}">
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small fw-bold text-secondary">Ngày sinh *</label>
                        <input type="date" class="form-control form-control-sm" name="ps_dob_${index}" required>
                    </div>
                </div>
            </div>
        `;
    };

    // Phase 3: Submit Booking Form
    document.getElementById("submitBooking").addEventListener("click", async (e) => {
        e.preventDefault();

        const form = document.getElementById("booking-form");
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            tour_id: tourId,
            contact_name: document.getElementById("contact_name").value,
            contact_phone: document.getElementById("contact_phone").value,
            contact_email: document.getElementById("contact_email").value,
            note: document.getElementById("note").value,
            departure_id: document.getElementById("departure_id").value,
            adults: document.getElementById("adults").value,
            children: document.getElementById("children").value,
        };

        // TODO: Call API for saving booking
        console.log("Sending booking data:", formData);
        alert("Cảm ơn bạn! Đã nhận yêu cầu đặt chỗ. Chuyển sang phần thanh toán...");
        // window.location.href = `/payment?booking_id=...`;
    });

    // Start
    fetchTourAndDepartures();
    renderPassengerFields();
});

async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const res = await fetch(filePath);
        const html = await res.text();
        target.innerHTML = html;

        if (filePath.includes("header.html")) {
            const scripts = target.querySelectorAll("script");
            scripts.forEach((script) => {
                const newScript = document.createElement("script");
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
                script.remove();
            });
        }
    } catch (error) {
        console.error("Không thể tải component:", error);
    }
}
