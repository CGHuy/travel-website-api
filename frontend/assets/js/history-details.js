// Chi tiết booking của User
const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/pages/user/login.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // 2. Lấy ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get("id");

    if (!bookingId) {
        alert("Không tìm thấy mã đặt chỗ!");
        window.location.href = "bookings-history.html";
        return;
    }

    // 3. Load Components (Header, Sidebar, Footer)
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html"),
    ]);

    // 4. Fetch và Render dữ liệu
    fetchBookingDetail(bookingId, token);
});

async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const html = await res.text();
        target.innerHTML = html;

        // Xử lý scripts trong component (ví dụ: dropdown menu, sidebar active)
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

        // Kích hoạt sidebar nếu là side-placeholder
        if (targetId === "side-placeholder") {
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll(".user-nav-menu .nav-link");
            navLinks.forEach(link => {
                const href = link.getAttribute("href");
                if (currentPath.includes(href) || href.includes("bookings-history")) {
                    link.classList.add("active");
                }
            });
        }
    } catch (err) {
        console.error(`Lỗi khi load component ${filePath}:`, err);
    }
}

async function fetchBookingDetail(bookingId, token) {
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/details`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderBookingDetail(result.data);
        } else {
            console.error("Fetch booking detail error:", result.message);
            document.getElementById("booking-detail-content").innerHTML = `
                <div class="alert alert-danger py-5 text-center">
                    <i class="fa-solid fa-triangle-exclamation fa-3x mb-3"></i>
                    <h4>Lỗi khi lấy thông tin</h4>
                    <p>${result.message || "Đã có lỗi xảy ra"}</p>
                    <a href="bookings-history.html" class="btn btn-primary mt-3">Quay lại lịch sử</a>
                </div>
            `;
        }
    } catch (error) {
        console.error("System error:", error);
    }
}

function renderBookingDetail(booking) {
    // 1. Header Info
    document.getElementById("booking-code").textContent = `Mã đơn: BOK${String(booking.id).padStart(3, '0')}`;
    document.getElementById("booking-created-at").textContent = new Date(booking.created_at).toLocaleString("vi-VN");
    
    const statusBadge = document.getElementById("booking-status");
    const statusInfo = getStatusInfo(booking.status);
    statusBadge.textContent = statusInfo.label;
    statusBadge.className = `status-badge status-${statusInfo.class}`;

    // 2. Tour Info
    document.getElementById("tour-name").textContent = booking.tour_name;
    document.getElementById("tour-img").src = booking.tour_image || "/assets/images/placeholder.png";
    document.getElementById("tour-duration").textContent = booking.tour_duration || "Chưa cập nhật";
    document.getElementById("dep-date").textContent = new Date(booking.departure_date).toLocaleDateString("vi-VN");
    document.getElementById("dep-location").textContent = booking.departure_location;
    document.getElementById("booking-pax").textContent = `${booking.adults} Người lớn, ${booking.children} Trẻ em`;

    // 3. Contact Info
    document.getElementById("contact-name").textContent = booking.contact_name;
    document.getElementById("contact-phone").textContent = booking.contact_phone;
    document.getElementById("contact-email").textContent = booking.contact_email;

    // 4. Passenger List
    const passengerTableBody = document.getElementById("passenger-list");
    if (booking.passengers && booking.passengers.length > 0) {
        passengerTableBody.innerHTML = booking.passengers.map(p => `
            <tr>
                <td><strong>${p.fullname}</strong></td>
                <td><span class="passenger-type-tag type-${p.passenger_type}">${p.passenger_type === 'adult' ? 'Người lớn' : 'Trẻ em'}</span></td>
                <td>${p.gender}</td>
                <td>${p.dob ? new Date(p.dob).toLocaleDateString("vi-VN") : '---'}</td>
            </tr>
        `).join("");
    } else {
        passengerTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">Không có thông tin hành khách</td></tr>`;
    }

    // 5. Payment Summary
    const breakdownEl = document.getElementById("price-breakdown");
    let breakdownHtml = "";
    
    // Tính toán breakdown
    if (booking.adults > 0) {
        const adultPrice = booking.price_default || 0;
        const totalAdult = adultPrice * booking.adults;
        breakdownHtml += `
            <div class="price-breakdown-item">
                <span>Người lớn (x${booking.adults})</span>
                <strong>${new Intl.NumberFormat("vi-VN").format(totalAdult)}đ</strong>
            </div>
        `;
    }
    
    if (booking.children > 0) {
        const childPrice = booking.price_child || 0;
        const totalChild = childPrice * booking.children;
        breakdownHtml += `
            <div class="price-breakdown-item">
                <span>Trẻ em (x${booking.children})</span>
                <strong>${new Intl.NumberFormat("vi-VN").format(totalChild)}đ</strong>
            </div>
        `;
    }
    
    breakdownEl.innerHTML = breakdownHtml;

    const totalPriceFormatted = new Intl.NumberFormat("vi-VN").format(booking.total_price);
    document.getElementById("total-price").textContent = `${totalPriceFormatted}đ`;
    
    const paymentStatusEl = document.getElementById("payment-status");
    if (booking.payment_status === "paid") {
        paymentStatusEl.textContent = "Đã thanh toán";
        paymentStatusEl.className = "text-success fw-bold";
    } else {
        paymentStatusEl.textContent = "Chưa thanh toán";
        paymentStatusEl.className = "text-danger fw-bold";
    }

    // 6. Note
    if (booking.note && booking.note.trim() !== "") {
        document.getElementById("booking-note").textContent = booking.note;
        document.getElementById("booking-note").style.fontStyle = "normal";
        document.getElementById("booking-note").classList.remove("text-muted");
    }

    // Event In hóa đơn
    document.getElementById("print-booking").addEventListener("click", () => {
        window.print();
    });

    // 7. Render Action Buttons (Demo Mode Logic)
    const actionContainer = document.getElementById("booking-actions");
    actionContainer.innerHTML = ""; // Clear old

    if (booking.status === "confirmed" && booking.payment_status === "paid") {
        // A. Nút Hủy Tour
        // Logic: Cho phép hủy nếu tour chưa diễn ra (Ngày khởi hành > Ngày hiện tại)
        const departureTime = new Date(booking.departure_date).getTime();
        const now = new Date().getTime();
        const isBeforeDeparture = departureTime > now;

        if (isBeforeDeparture) {
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "btn btn-outline-danger btn-sm fw-bold rounded-pill px-3";
            cancelBtn.innerHTML = `<i class="fa-solid fa-xmark me-1"></i> Yêu cầu hủy`;
            cancelBtn.onclick = () => {
                const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
                cancelModal.show();

                const confirmBtn = document.getElementById("confirm-cancel-btn");
                // Gỡ bỏ event cũ tránh gọi nhiều API
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

                newConfirmBtn.addEventListener("click", async () => {
                    newConfirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Đang xử lý...`;
                    newConfirmBtn.disabled = true;
                    
                    try {
                        const token = localStorage.getItem("token");
                        const response = await fetch(`${API_URL}/bookings/${booking.id}/cancel`, {
                            method: "PUT",
                            headers: {
                                "Authorization": `Bearer ${token}`
                            }
                        });
                        const resData = await response.json();
                        if (resData.success) {
                            alert("Đã gửi yêu cầu hủy thành công!");
                            window.location.reload();
                        } else {
                            alert(resData.message || "Không thể hủy lúc này.");
                        }
                    } catch (error) {
                        console.error("Cancel API error", error);
                        alert("Có lỗi xảy ra khi gọi máy chủ!");
                        newConfirmBtn.innerHTML = `Chắc chắn Hủy`;
                        newConfirmBtn.disabled = false;
                    }
                });
            };
            actionContainer.appendChild(cancelBtn);
        }

        // B. Nút Đánh Giá Tour
        // Logic Thực tế: Chỉ cho phép đánh giá khi tour đã bắt đầu hoặc kết thúc (Ngày khởi hành <= Ngày hiện tại)
        // LƯU Ý DEMO: Nếu muốn hiện luôn để cô xem, hãy đổi dấu <= thành >= 
        const hasStarted = departureTime <= now;

        if (hasStarted && !booking.is_reviewed) {
            const reviewBtn = document.createElement("button");
            reviewBtn.className = "btn btn-warning btn-sm fw-bold rounded-pill px-3 text-dark";
            reviewBtn.innerHTML = `<i class="fa-solid fa-star me-1"></i> Viết đánh giá`;
            reviewBtn.onclick = () => {
                const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
                reviewModal.show();

                const reviewForm = document.getElementById("review-form");
                // Gỡ bỏ event cũ của form
                const newReviewForm = reviewForm.cloneNode(true);
                reviewForm.parentNode.replaceChild(newReviewForm, reviewForm);

                // Logic chọn sao (Phải gán SAU KHI replaceChild vì cloneNode không copy event listener)
                const stars = newReviewForm.querySelectorAll('.star-btn');
                const ratingInput = newReviewForm.querySelector('#review-rating-value');
                const ratingText = newReviewForm.querySelector('#rating-text');
                const ratingLevels = {
                    1: 'Rất tệ',
                    2: 'Tệ',
                    3: 'Chấp nhận được',
                    4: 'Tốt',
                    5: 'Rất tuyệt vời'
                };

                stars.forEach(star => {
                    star.onclick = () => {
                        const val = parseInt(star.getAttribute('data-value'));
                        ratingInput.value = val;
                        ratingText.textContent = ratingLevels[val];
                        
                        stars.forEach(s => {
                            if (parseInt(s.getAttribute('data-value')) <= val) {
                                s.classList.add('active');
                            } else {
                                s.classList.remove('active');
                            }
                        });
                    };
                });

                newReviewForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const rating = ratingInput.value;
                    const comment = newReviewForm.querySelector("#review-comment").value;
                    const submitBtn = newReviewForm.querySelector("button[type='submit']");
                    
                    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Đang gửi...`;
                    submitBtn.disabled = true;
                    
                    try {
                        const token = localStorage.getItem("token");
                        const response = await fetch(`${API_URL}/reviews`, {
                            method: "POST",
                            body: JSON.stringify({
                                tour_id: booking.tour_id,
                                booking_id: booking.id,
                                rating: parseInt(rating),
                                comment: comment
                            }),
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            }
                        });
                        const resData = await response.json();
                        if (resData.success) {
                            alert("Cảm ơn bạn đã gửi đánh giá thành công!");
                            window.location.reload();
                        } else {
                            alert(resData.message || "Không thể gửi đánh giá.");
                            submitBtn.innerHTML = `Gửi đánh giá`;
                            submitBtn.disabled = false;
                        }
                    } catch (error) {
                        console.error("Review API error", error);
                        alert("Có lỗi xảy ra khi gọi máy chủ!");
                        submitBtn.innerHTML = `Gửi đánh giá`;
                        submitBtn.disabled = false;
                    }
                });
            };
            actionContainer.appendChild(reviewBtn);
        }
    }
}

function getStatusInfo(status) {
    switch (status) {
        case "confirmed":
            return { label: "Đã xác nhận", class: "confirmed" };
        case "cancelled":
            return { label: "Đã hủy", class: "cancelled" };
        case "pending":
            return { label: "Chờ xử lý", class: "pending" };
        default:
            return { label: status, class: "pending" };
    }
}
