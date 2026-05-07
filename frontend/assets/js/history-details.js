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
        window.showToast("Không tìm thấy mã đặt chỗ!", "error");
        setTimeout(() => window.location.href = "bookings-history.html", 1500);
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
    
    const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);

    // --- Người lớn ---
    if (booking.adults > 0) {
        const adultTourPrice  = parseFloat(booking.price_default  || 0);
        const adultMovePrice  = parseFloat(booking.price_moving   || 0);
        const totalAdultTour  = adultTourPrice * booking.adults;
        const totalAdultMove  = adultMovePrice * booking.adults;

        breakdownHtml += `
            <div class="price-breakdown-item">
                <span>Tour người lớn (x${booking.adults})</span>
                <strong>${fmt(totalAdultTour)}đ</strong>
            </div>`;

        if (adultMovePrice > 0) {
            breakdownHtml += `
            <div class="price-breakdown-item" style="color:#64748b;">
                <span style="padding-left:12px;"><i class="fa-solid fa-plane-departure" style="font-size:11px;margin-right:4px;"></i>Di chuyển NL (x${booking.adults})</span>
                <strong>${fmt(totalAdultMove)}đ</strong>
            </div>`;
        }
    }
    
    // --- Trẻ em ---
    if (booking.children > 0) {
        const childTourPrice  = parseFloat(booking.price_child        || 0);
        const childMovePrice  = parseFloat(booking.price_moving_child || 0);
        const totalChildTour  = childTourPrice * booking.children;
        const totalChildMove  = childMovePrice * booking.children;

        breakdownHtml += `
            <div class="price-breakdown-item">
                <span>Tour trẻ em (x${booking.children})</span>
                <strong>${fmt(totalChildTour)}đ</strong>
            </div>`;

        if (childMovePrice > 0) {
            breakdownHtml += `
            <div class="price-breakdown-item" style="color:#64748b;">
                <span style="padding-left:12px;"><i class="fa-solid fa-plane-departure" style="font-size:11px;margin-right:4px;"></i>Di chuyển TE (x${booking.children})</span>
                <strong>${fmt(totalChildMove)}đ</strong>
            </div>`;
        }
    }

    breakdownEl.innerHTML = breakdownHtml;

    const totalPriceFormatted = new Intl.NumberFormat("vi-VN").format(booking.total_price);
    document.getElementById("total-price").textContent = `${totalPriceFormatted}đ`;
    
    const paymentStatusEl = document.getElementById("payment-status");
    if (booking.payment_status === "paid") {
        paymentStatusEl.textContent = "Đã thanh toán";
        paymentStatusEl.className = "text-success fw-bold";
    } else if (booking.payment_status === "pending") {
        paymentStatusEl.textContent = "Đang chờ hoàn tiền";
        paymentStatusEl.className = "text-warning fw-bold";
    } else if (booking.payment_status === "refunded") {
        paymentStatusEl.textContent = "Đã hoàn tiền";
        paymentStatusEl.className = "text-info fw-bold";
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

    // Setup Invoice Logic
    setupInvoiceLogic(booking);

    // 7. Render Action Buttons
    const actionContainer = document.getElementById("booking-actions");
    actionContainer.innerHTML = ""; // Clear old

    // Badge cho trạng thái đang chờ duyệt hủy
    if (booking.status === "pending") {
        actionContainer.innerHTML = `
            <span class="badge rounded-pill py-2 px-3 fw-semibold" 
                  style="background:#fff8e1;color:#f39c12;border:1.5px solid #f39c12;font-size:13px;">
                <i class="fa-solid fa-clock me-1"></i>Yêu cầu hủy tour đang chờ xử lý
            </span>`;
        return;
    }

    // Badge khi đơn đã bị hủy
    if (booking.status === "cancelled") {
        actionContainer.innerHTML = `
            <span class="badge rounded-pill py-2 px-3 fw-semibold" 
                  style="background:#fff5f5;color:#e74c3c;border:1.5px solid #e74c3c;font-size:13px;">
                <i class="fa-solid fa-ban me-1"></i>Đơn đã bị hủy
            </span>`;
        return;
    }

    if (booking.status === "confirmed" && booking.payment_status === "paid") {
        const departureTime = new Date(booking.departure_date).getTime();
        const now = new Date().getTime();
        const isBeforeDeparture = departureTime > now;
        const hasStarted = departureTime <= now;

        // A. Nút Hủy Tour (chỉ khi chưa khởi hành)
        if (isBeforeDeparture) {
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "btn btn-outline-danger btn-sm fw-bold rounded-pill px-3";
            cancelBtn.innerHTML = `<i class="fa-solid fa-xmark me-1"></i> Yêu cầu hủy`;
            cancelBtn.onclick = () => {
                const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
                
                // --- Bắt đầu tính toán phí hủy ---
                const currentDate = new Date();
                const departureDate = new Date(booking.departure_date);
                
                // Tính số ngày chênh lệch
                const timeDiff = departureDate.getTime() - currentDate.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Làm tròn lên số ngày
                
                let penaltyPercent = 0;
                if (daysDiff >= 30) {
                    penaltyPercent = 0;
                } else if (daysDiff >= 15 && daysDiff < 30) {
                    penaltyPercent = 50;
                } else {
                    penaltyPercent = 100;
                }
                
                const penaltyAmount = (booking.total_price * penaltyPercent) / 100;
                const refundAmount = booking.total_price - penaltyAmount;
                
                // Render vào Modal
                document.getElementById('modal-dep-date').textContent = departureDate.toLocaleDateString('vi-VN');
                document.getElementById('modal-days-left').textContent = `${daysDiff} ngày`;
                document.getElementById('modal-total-price').textContent = `${new Intl.NumberFormat('vi-VN').format(booking.total_price)}đ`;
                document.getElementById('modal-penalty-percent').textContent = `${penaltyPercent}%`;
                document.getElementById('modal-refund-amount').textContent = `${new Intl.NumberFormat('vi-VN').format(refundAmount)}đ`;
                // --- Kết thúc tính toán ---

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
                            window.showToast("Đã gửi yêu cầu hủy thành công!", "success");
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            window.showToast(resData.message || "Không thể hủy lúc này.", "error");
                        }
                    } catch (error) {
                        console.error("Cancel API error", error);
                        window.showToast("Có lỗi xảy ra khi gọi máy chủ!", "error");
                        newConfirmBtn.innerHTML = `Chắc chắn Hủy`;
                        newConfirmBtn.disabled = false;
                    }
                });
            };
            actionContainer.appendChild(cancelBtn);
        }

        // B. Nút Đánh Giá Tour (sau ngày khởi hành, chưa review)
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

                // Logic chọn sao
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
                        const response = await fetch(`${API_URL}/reviews/create`, {
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
                            window.showToast("Cảm ơn bạn đã gửi đánh giá thành công!", "success");
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            window.showToast(resData.message || "Không thể gửi đánh giá.", "error");
                            submitBtn.innerHTML = `Gửi đánh giá`;
                            submitBtn.disabled = false;
                        }
                    } catch (error) {
                        console.error("Review API error", error);
                        window.showToast("Có lỗi xảy ra khi gọi máy chủ!", "error");
                        submitBtn.innerHTML = `Gửi đánh giá`;
                        submitBtn.disabled = false;
                    }
                });
            };
            actionContainer.appendChild(reviewBtn);
        }

        // C. Badge "Đã đánh giá ✓" khi tour kết thúc và đã review
        if (hasStarted && booking.is_reviewed) {
            const reviewedBadge = document.createElement("span");
            reviewedBadge.className = "badge rounded-pill py-2 px-3 fw-semibold";
            reviewedBadge.style.cssText = "background:#f0fdf4;color:#16a34a;border:1.5px solid #16a34a;font-size:13px;";
            reviewedBadge.innerHTML = `<i class="fa-solid fa-check me-1"></i>Đã đánh giá`;
            actionContainer.appendChild(reviewedBadge);
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
            return { label: "Yêu cầu hủy", class: "pending" };
        default:
            return { label: status, class: "pending" };
    }
}

function setupInvoiceLogic(booking) {
    const btnPrint = document.getElementById("print-booking");
    const modal = document.getElementById("invoice-modal");
    if (!btnPrint || !modal) return;

    const closeBtn = modal.querySelector(".close-modal");
    const doPrintBtn = document.getElementById("btn-do-print");

    btnPrint.onclick = () => {
        // Populate data
        document.getElementById("inv-booking-id").textContent = `#BOK${String(booking.id).padStart(3, "0")}`;
        document.getElementById("inv-current-date").textContent = new Date().toLocaleDateString("vi-VN");
        document.getElementById("inv-fullname").textContent = booking.contact_name;
        document.getElementById("inv-phone").textContent = booking.contact_phone;
        document.getElementById("inv-email").textContent = booking.contact_email;
        document.getElementById("inv-tour-name").textContent = booking.tour_name;
        document.getElementById("inv-dep-date").textContent = new Date(booking.departure_date).toLocaleDateString("vi-VN");
        document.getElementById("inv-dep-loc").textContent = booking.departure_location;

        // Price Breakdown
        const priceRows = document.getElementById("inv-price-rows");
        if (priceRows) {
            const adultBase = parseFloat(booking.price_default || 0) + parseFloat(booking.price_moving || 0);
            const childBase = parseFloat(booking.price_child || 0) + parseFloat(booking.price_moving_child || 0);
            const adultTotal = booking.adults * adultBase;
            const childTotal = booking.children * childBase;

            let rowsHtml = `
                <tr>
                    <td>Vé người lớn</td>
                    <td>${booking.adults}</td>
                    <td>${formatCurrency(adultBase)}</td>
                    <td class="text-right">${formatCurrency(adultTotal)}</td>
                </tr>
            `;

            if (booking.children > 0) {
                rowsHtml += `
                    <tr>
                        <td>Vé trẻ em</td>
                        <td>${booking.children}</td>
                        <td>${formatCurrency(childBase)}</td>
                        <td class="text-right">${formatCurrency(childTotal)}</td>
                    </tr>
                `;
            }

            priceRows.innerHTML = rowsHtml;
        }

        const totalPrice = parseFloat(booking.total_price || 0);
        document.getElementById("inv-total-price").textContent = formatCurrency(totalPrice);
        document.getElementById("inv-total-text").textContent = numberToVietnameseText(totalPrice) + " đồng chẵn.";
        
        const paymentStatusEl = document.getElementById("inv-payment-status");
        if (booking.payment_status === "paid") {
            paymentStatusEl.textContent = "Đã thanh toán";
            paymentStatusEl.className = "text-right text-success fw-bold";
        } else {
            paymentStatusEl.textContent = "Chưa hoàn tất";
            paymentStatusEl.className = "text-right text-danger";
        }

        // QR Code
        const qrImg = document.getElementById("inv-qr-code");
        if (qrImg) {
            const bookingRef = `BOK${String(booking.id).padStart(3, "0")}`;
            qrImg.innerHTML = `<img src="https://quickchart.io/qr?text=${bookingRef}&size=100" alt="QR" style="border-radius: 4px;" />`;
        }

        modal.style.display = "flex";
    };

    closeBtn.onclick = () => (modal.style.display = "none");
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    doPrintBtn.onclick = () => { printInvoice(); };
}

/**
 * Chức năng in hóa đơn chuẩn
 */
function printInvoice() {
    // Nếu đang dùng Bootstrap Modal, đôi khi cần trigger nhẹ để đảm bảo layout in
    window.print();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function numberToVietnameseText(number) {
    const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    if (number === 0) return "Không";
    if (number < 0) return "Âm " + numberToVietnameseText(Math.abs(number));

    let res = "";
    let unitIdx = 0;

    function readThreeDigits(n, isLast) {
        let s = "";
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0 || !isLast) {
            s += digits[h] + " trăm ";
            if (t === 0 && u !== 0) s += "lẻ ";
        }

        if (t > 0) {
            if (t === 1) s += "mười ";
            else s += digits[t] + " mươi ";
        }

        if (u > 0) {
            if (t > 1 && u === 1) s += "mốt ";
            else if (t > 0 && u === 5) s += "lăm ";
            else s += digits[u];
        }

        return s;
    }

    let temp = number;
    while (temp > 0) {
        const three = temp % 1000;
        if (three > 0) {
            const part = readThreeDigits(three, temp < 1000);
            res = part + " " + units[unitIdx] + " " + res;
        }
        temp = Math.floor(temp / 1000);
        unitIdx++;
    }

    return res.trim().charAt(0).toUpperCase() + res.trim().slice(1);
}
