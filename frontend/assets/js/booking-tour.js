// BookingTour.js - Logic for booking-tour.html

// 0. Xác thực ngay khi script được tải để tránh nháy giao diện hoặc truy cập trái phép
(function () {
    if (!localStorage.getItem("token")) {
        window.location.replace(`/login?redirect=${encodeURIComponent(window.location.href)}`);
    }
})();

document.addEventListener("DOMContentLoaded", async () => {
    const notify = (title, message = "", type = "info", duration = 4500) => {
        if (typeof window.showToast === "function") {
            window.showToast(title, message, type, duration);
            return;
        }
        // Fallback alert: bỏ phần "title: " để tránh bị lặp hoặc thêm "phần đầu" không mong muốn
        alert(message || title);
    };

    await Promise.all([loadComponent("header-placeholder", "../../components/header.html"), loadComponent("footer-placeholder", "../../components/footer.html")]);

    // Helper fetch có kèm token
    const fetchWithAuth = async (url, options = {}) => {
        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
            "Authorization": `Bearer ${token}`
        };
        return fetch(url, { ...options, headers });
    };

    // 1. Get tourId from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get("tour_id");

    if (!tourId) {
        notify("Không tìm thấy tour", "Không có thông tin tour để đặt. Hệ thống sẽ quay về trang chủ.", "warning");
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
    let currentUserRole = null;

    const setBookingPermission = (role) => {
        const submitBtn = document.getElementById("submitBooking");
        const warningEl = document.getElementById("booking-role-warning");
        if (!submitBtn) return;

        const isAllowed = role === "customer";
        submitBtn.disabled = !isAllowed;

        if (isAllowed) {
            submitBtn.classList.remove("disabled");
            submitBtn.removeAttribute("title");
            if (warningEl) warningEl.classList.add("d-none");
        } else {
            submitBtn.classList.add("disabled");
            submitBtn.title = "Chỉ tài khoản khách hàng mới có thể đặt tour.";
            if (warningEl) warningEl.classList.remove("d-none");
        }
    };

    // Mặc định khóa đặt tour cho đến khi xác định được role từ profile
    setBookingPermission(currentUserRole);

    // Phase 1: Fetch Tour Data
    const fetchTourAndDepartures = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.replace(`/login?redirect=${encodeURIComponent(window.location.href)}`);
                return;
            }

            const response = await fetchWithAuth(`/api/list-tours/tour-departures/${tourId}`);

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

            const response = await fetchWithAuth("/api/users/profile");

            const result = await response.json();
            if (result.success && result.data) {
                const user = result.data;
                currentUserRole = user.role || null;
                setBookingPermission(currentUserRole);
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
                if (document.getElementById("contact_gender") && user.gender) {
                    document.getElementById("contact_gender").value = user.gender;
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
        const formattedCode = `#TOUR${String(tour.id).padStart(3, "0")}`;
        document.getElementById("tour-code").innerText = formattedCode;
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
            notify("Không đủ chỗ", `Lịch khởi hành này chỉ còn ${maxSeats} chỗ trống.`, "warning");

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
                notify("Vượt quá số chỗ", `Lịch trình này chỉ còn tối đa ${dep.seats_available} chỗ.`, "warning");
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
            locale: {
                ...flatpickr.l10ns.vn,
                months: {
                    ...flatpickr.l10ns.vn.months,
                    longhand: [
                        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
                        "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
                        "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                    ]
                }
            },
            dateFormat: "Y-m-d", // Định dạng lưu trữ/gửi server
            altInput: true,
            altFormat: "d/m/Y", // Định dạng hiển thị cho người dùng
            allowInput: true,
            monthSelectorType: "dropdown",
            maxDate: "today", 
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

        if (currentUserRole !== "customer") {
            notify("", "Chỉ tài khoản khách hàng mới có thể đặt tour.", "warning");
            return;
        }

        const form = document.getElementById("booking-form");
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // --- Custom Age Validation (Matching Backend) ---
        clearFieldErrors();
        let hasErrors = false;
        const today = new Date();
        
        // 1. Kiểm tra người liên hệ (Contact person) >= 18 tuổi
        const contactDobInput = document.getElementById("contact_dob");
        const contactDobVal = contactDobInput.value;
        if (contactDobVal) {
            const contactBirthYear = new Date(contactDobVal).getFullYear();
            const age = today.getFullYear() - contactBirthYear;
            if (age < 18) {
                showFieldError("contact_dob", "Người đặt tour phải đủ 18 tuổi trở lên.");
                hasErrors = true;
            }
        }

        // 2. Thu thập và kiểm tra thông tin hành khách đi cùng
        const adultsCount = parseInt(document.getElementById("adults").value);
        const childrenCount = parseInt(document.getElementById("children").value);
        const totalPax = adultsCount + childrenCount;
        const passengers = [];

        if (totalPax > 1) {
            for (let i = 2; i <= totalPax; i++) {
                const nameInput = document.querySelector(`[name="ps_name_${i}"]`);
                const dobInput = document.querySelector(`[name="ps_dob_${i}"]`);
                const typeInput = i <= adultsCount ? "adult" : "child";

                const dobVal = dobInput.value;
                const nameVal = nameInput.value;

                if (dobVal) {
                    const birthYear = new Date(dobVal).getFullYear();
                    const age = today.getFullYear() - birthYear;

                    if (typeInput === "child" && age >= 6) {
                        showFieldError(`ps_dob_${i}`, "Trẻ em phải dưới 6 tuổi. Vui lòng đặt ở mục người lớn.");
                        hasErrors = true;
                    }
                    if (typeInput === "adult" && age < 6) {
                        showFieldError(`ps_dob_${i}`, "Người lớn phải từ 6 tuổi trở lên. Vui lòng đặt ở mục trẻ em.");
                        hasErrors = true;
                    }
                }

                passengers.push({ name: nameVal, gender: document.querySelector(`[name="ps_gender_${i}"]`).value, dob: dobVal, type: typeInput });
            }
        }

        if (hasErrors) {
            const firstError = document.querySelector(".is-invalid");
            if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        // --- End Custom Age Validation ---

        const btn = e.currentTarget;
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Đang xử lý...';

        try {
            const token = localStorage.getItem("token");
            const bookingData = {
                departure_id: document.getElementById("departure_id").value,
                adults: adultsCount,
                children: childrenCount,
                contact_name: document.getElementById("contact_name").value,
                contact_phone: document.getElementById("contact_phone").value,
                contact_email: document.getElementById("contact_email").value,
                contact_dob: contactDobVal,
                contact_gender: document.getElementById("contact_gender").value,
                note: document.getElementById("note").value,
                passengers: passengers,
            };

            const response = await fetchWithAuth("/api/bookings/create-payment-url", {
                method: "POST",
                body: JSON.stringify(bookingData),
            });

            const result = await response.json();

            if (result.vnpayUrl) {
                // Chuyển hướng sang trang thanh toán của VNPay
                window.location.href = result.vnpayUrl;
            } else {
                notify("", result.message || "Vui lòng thử lại sau.", "error");
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        } catch (error) {
            console.error("Booking Error:", error);
            notify("Lỗi kết nối", "Đã có lỗi xảy ra trong quá trình kết nối thanh toán.", "error");
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

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId) || document.querySelector(`[name="${inputId}"]`);
    if (!input) return;

    input.classList.add("is-invalid");
    
    // Handle Flatpickr altInput
    if (input._flatpickr && input._flatpickr.altInput) {
        input._flatpickr.altInput.classList.add("is-invalid");
    }

    let feedback = input.parentElement.querySelector(".invalid-feedback");
    if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback d-block"; 
        input.parentElement.appendChild(feedback);
    }
    feedback.innerText = message;
}

function clearFieldErrors() {
    document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    document.querySelectorAll(".invalid-feedback").forEach(el => el.remove());
}

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
