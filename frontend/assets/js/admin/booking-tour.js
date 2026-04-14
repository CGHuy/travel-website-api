// BookingTour.js - Logic for booking-tour.html

// 0. Xác thực ngay khi script được tải để tránh nháy giao diện hoặc truy cập trái phép
(function () {
    if (!localStorage.getItem("token")) {
        window.location.replace(`/login?redirect=${encodeURIComponent(window.location.href)}`);
    }
})();

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
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.replace(`/login?redirect=${encodeURIComponent(window.location.href)}`);
                return;
            }

            const response = await fetch(`/api/list-tours/tour-departures/${tourId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                window.location.replace(`/login?redirect=${encodeURIComponent(window.location.href)}`);
                return;
            }

            const result = await response.json();

            if (result.success && result.data) {
                tourInfo = result.data.tour;
                departuresInfo = result.data.departures;
                renderTourSummary(tourInfo);
                renderDepartures(departuresInfo);
            } else {
                console.error("Lỗi tải thông tin tour:", result.message);
            }
        } catch (error) {
            console.error("Error fetching tour info:", error);
        }
    };

    // Phase 1.5: Fetch User Profile
    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch("/api/users/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.success && result.data) {
                const user = result.data;
                if (document.getElementById("contact_name")) {
                    document.getElementById("contact_name").value = user.fullname || "";
                }
                if (document.getElementById("contact_phone")) {
                    document.getElementById("contact_phone").value = user.phone || "";
                }
                if (document.getElementById("contact_email")) {
                    document.getElementById("contact_email").value = user.email || "";
                }
                if (document.getElementById("contact_dob") && user.dob) {
                    // Flatpickr sẽ tự nhận diện định dạng yyyy-mm-dd từ database
                    const contactDobInput = document.getElementById("contact_dob");
                    if (contactDobInput._flatpickr) {
                        contactDobInput._flatpickr.setDate(user.dob);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const renderTourSummary = (tour) => {
        // Display tour info
        document.getElementById("bc-tour-name").innerText = tour.name;
        document.getElementById("tour-name-display").innerText = tour.name;
        document.getElementById("tour-code").innerText = String(tour.code || "");
        document.getElementById("tour-img").src = tour.cover_image;
        document.getElementById("tour-duration").innerText = tour.duration;

        // Cập nhật background header banner
        const headerBanner = document.querySelector(".booking-header-banner");
        if (headerBanner) {
            headerBanner.style.setProperty("--header-bg", `url(${tour.cover_image})`);
        }

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

                // Kiểm tra nếu số người hiện tại vượt quá số chỗ mới chọn
                validateSeats(dep.seats_available);

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

    // Hàm kiểm tra và giới hạn số chỗ
    const validateSeats = (maxSeats) => {
        const adultsInput = document.getElementById("adults");
        const childrenInput = document.getElementById("children");

        let adults = parseInt(adultsInput.value) || 0;
        let children = parseInt(childrenInput.value) || 0;

        if (adults + children > maxSeats) {
            alert(`Rất tiếc, lịch khởi hành này chỉ còn ${maxSeats} chỗ trống.`);

            // Ưu tiên giữ người lớn, giảm trẻ em trước
            if (adults > maxSeats) {
                adultsInput.value = maxSeats;
                childrenInput.value = 0;
            } else {
                childrenInput.value = maxSeats - adults;
            }

            calculateTotal();
            renderPassengerFields();
        }
    };

    // Lắng nghe sự kiện nhập từ bàn phím
    document.getElementById("adults").addEventListener("input", (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) {
            e.target.value = 1;
        }
        const depId = document.getElementById("departure_id").value;
        const dep = departuresInfo.find((d) => d.id == depId);
        if (dep) validateSeats(dep.seats_available);
        calculateTotal();
        renderPassengerFields();
    });

    document.getElementById("children").addEventListener("input", (e) => {
        const depId = document.getElementById("departure_id").value;
        const dep = departuresInfo.find((d) => d.id == depId);
        if (dep) validateSeats(dep.seats_available);
        calculateTotal();
        renderPassengerFields();
    });

    // Phase 2: Quantity & Calculation Logic
    window.updateQty = (type, change) => {
        const input = document.getElementById(type);
        let current = parseInt(input.value) || 0;
        let newVal = current + change;

        if (type === "adults" && newVal < 1) newVal = 1;
        if (type === "children" && newVal < 0) newVal = 0;

        // Kiểm tra tổng số chỗ nếu đã chọn lịch khởi hành
        const depId = document.getElementById("departure_id").value;
        const dep = departuresInfo.find((d) => d.id == depId);

        if (dep) {
            const otherType = type === "adults" ? "children" : "adults";
            const otherVal = parseInt(document.getElementById(otherType).value) || 0;
            if (newVal + otherVal > dep.seats_available) {
                alert(`Lịch trình này chỉ còn tối đa ${dep.seats_available} chỗ.`);
                return;
            }
        }

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

        // Ẩn/Hiện các dòng liên quan đến trẻ em
        const rowBaseChild = document.getElementById("row-base-child");
        const rowMovingChild = document.getElementById("row-moving-child");

        if (children > 0) {
            if (rowBaseChild) rowBaseChild.setAttribute("style", "display: flex !important;");
            // Chỉ hiện dòng phụ phí nếu đã chọn lịch khởi hành (có movingChildPrice)
            if (rowMovingChild && movingChildPrice > 0) {
                rowMovingChild.setAttribute("style", "display: flex !important;");
            } else if (rowMovingChild) {
                rowMovingChild.setAttribute("style", "display: none !important;");
            }
        } else {
            if (rowBaseChild) rowBaseChild.setAttribute("style", "display: none !important;");
            if (rowMovingChild) rowMovingChild.setAttribute("style", "display: none !important;");
        }

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
        initDatePickers();
    };

    const initDatePickers = () => {
        flatpickr(".datepicker", {
            locale: "vn",
            dateFormat: "Y-m-d", // Định dạng lưu trữ/gửi server
            altInput: true,
            altFormat: "d/m/Y", // Định dạng hiển thị cho người dùng
            allowInput: true,
        });
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
                        <input type="text" class="form-control form-control-sm datepicker" name="ps_dob_${index}" placeholder="dd/mm/yyyy" required>
                    </div>
                </div>
            </div>
        `;
    };

    // Phase 3: Submit Booking Form & VNPay Redirect
    document.getElementById("submitBooking").addEventListener("click", async (e) => {
        e.preventDefault();

        const form = document.getElementById("booking-form");
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const btn = e.currentTarget;
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Đang xử lý...';

        try {
            const token = localStorage.getItem("token");
            const adults = parseInt(document.getElementById("adults").value);
            const children = parseInt(document.getElementById("children").value);

            // Thu thập thông tin hành khách đi cùng
            const passengers = [];
            const totalCount = adults + children;
            if (totalCount > 1) {
                for (let i = 2; i <= totalCount; i++) {
                    passengers.push({
                        name: document.querySelector(`[name="ps_name_${i}"]`).value,
                        gender: document.querySelector(`[name="ps_gender_${i}"]`).value,
                        dob: document.querySelector(`[name="ps_dob_${i}"]`).value,
                        type: i <= adults ? "adult" : "child",
                    });
                }
            }

            const bookingData = {
                departure_id: document.getElementById("departure_id").value,
                adults: adults,
                children: children,
                contact_name: document.getElementById("contact_name").value,
                contact_phone: document.getElementById("contact_phone").value,
                contact_email: document.getElementById("contact_email").value,
                contact_dob: document.getElementById("contact_dob").value,
                note: document.getElementById("note").value,
                passengers: passengers,
            };

            const response = await fetch("/api/bookings/create-payment-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();

            if (result.vnpayUrl) {
                // Chuyển hướng sang trang thanh toán của VNPay
                window.location.href = result.vnpayUrl;
            } else {
                alert("Lỗi: " + (result.message || "Không thể tạo liên kết thanh toán."));
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Đã có lỗi xảy ra trong quá trình kết nối thanh toán.");
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    });

    // Start
    initDatePickers();
    fetchTourAndDepartures();
    fetchUserProfile();
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
