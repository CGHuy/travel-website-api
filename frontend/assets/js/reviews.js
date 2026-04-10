// Logic for User Reviews page
document.addEventListener("DOMContentLoaded", async () => {
    // Load components
    await Promise.all([
        loadComponent("header-placeholder", "../../components/header.html"),
        loadComponent("footer-placeholder", "../../components/footer.html"),
        loadComponent("side-placeholder", "../../components/user-sidebar.html")
    ]);

    initReviewsPage();
});

async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const html = await res.text();
        target.innerHTML = html;

        // Re-run sidebar active state after it's loaded
        if (targetId === "side-placeholder") {
            initSidebarActiveState();
        }
    } catch (err) {
        console.error(`Failed to load component ${filePath}:`, err);
    }
}

function initSidebarActiveState() {
    const currentPath = window.location.pathname;
    
    // Handle normal links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.classList.add("active");
        }
    });
}

async function initReviewsPage() {
    console.log("Reviews page initialized");

    const historyList = document.getElementById("review-history-list");
    const noReviews = document.getElementById("no-reviews");
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/auth/login";
        return;
    }

    // Function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render history
    async function fetchAndRenderReviews() {
        try {
            historyList.innerHTML = '<div class="text-center p-5"><i class="fa-solid fa-spinner fa-spin fa-2x text-primary"></i></div>';
            
            const res = await fetch("/api/reviews/", { // Changed from /api/reviews/user
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message);

            const reviews = data.data;

            if (reviews.length === 0) {
                historyList.classList.add("d-none");
                noReviews.classList.remove("d-none");
                return;
            }

            historyList.classList.remove("d-none");
            noReviews.classList.add("d-none");
            historyList.innerHTML = "";

            reviews.forEach(review => {
                const card = document.createElement("div");
                card.className = "review-item-card animate__animated animate__fadeInUp";
                
                let starsHtml = "";
                for (let i = 1; i <= 5; i++) {
                    starsHtml += `<i class="${i <= review.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i> `;
                }

                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1 text-primary fw-bold">${review.tour_name}</h6>
                            <div class="review-date">
                                <i class="fa-regular fa-calendar-days me-2"></i> ${formatDate(review.created_at)}
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary border-0 btn-edit-review" 
                                data-id="${review.id}" 
                                data-rating="${review.rating}" 
                                data-comment="${review.comment.replace(/"/g, '&quot;')}"
                                data-tour="${review.tour_name}">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0 btn-delete-review" data-id="${review.id}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    <div class="review-stars-static">${starsHtml}</div>
                    <div class="review-text">${review.comment}</div>
                `;
                historyList.appendChild(card);
            });

            // Add delete listeners
            document.querySelectorAll(".btn-delete-review").forEach(btn => {
                btn.addEventListener("click", function() {
                    const reviewId = this.getAttribute("data-id");
                    confirmDeleteReview(reviewId);
                });
            });

            // Add edit listeners
            document.querySelectorAll(".btn-edit-review").forEach(btn => {
                btn.addEventListener("click", function() {
                    const id = this.getAttribute("data-id");
                    const rating = this.getAttribute("data-rating");
                    const comment = this.getAttribute("data-comment");
                    const tourName = this.getAttribute("data-tour");
                    handleEditReview(id, rating, comment, tourName);
                });
            });

        } catch (err) {
            console.error("Failed to fetch reviews:", err);
            historyList.innerHTML = `<div class="alert alert-danger">Lỗi khi tải dữ liệu: ${err.message}</div>`;
        }
    }

    async function handleEditReview(id, currentRating, currentComment, tourName) {
        let selectedRating = currentRating;
        
        const { value: formValues } = await Swal.fire({
            title: `Chỉnh sửa đánh giá`,
            html: `
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold">Tour: <span class="text-primary">${tourName}</span></label>
                </div>
                <div class="mb-3">
                    <label class="form-label d-block text-start fw-bold">Chọn số sao:</label>
                    <div class="edit-star-rating d-flex gap-2 fs-3 text-warning cursor-pointer">
                        ${[1,2,3,4,5].map(i => `<i class="${i <= currentRating ? 'fa-solid' : 'fa-regular'} fa-star star-btn" data-value="${i}"></i>`).join('')}
                    </div>
                </div>
                <div class="mb-3">
                    <label for="edit-comment" class="form-label d-block text-start fw-bold">Nhận xét của bạn:</label>
                    <textarea id="edit-comment" class="form-control" rows="4" placeholder="Chia sẻ trải nghiệm của bạn...">${currentComment}</textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Cập nhật',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#3b82f6',
            didOpen: () => {
                const stars = document.querySelectorAll('.star-btn');
                stars.forEach(star => {
                    star.addEventListener('click', function() {
                        const val = this.getAttribute('data-value');
                        selectedRating = val;
                        stars.forEach(s => {
                            const sVal = s.getAttribute('data-value');
                            if (sVal <= val) {
                                s.classList.remove('fa-regular');
                                s.classList.add('fa-solid');
                            } else {
                                s.classList.remove('fa-solid');
                                s.classList.add('fa-regular');
                            }
                        });
                    });
                });
            },
            preConfirm: () => {
                const comment = document.getElementById('edit-comment').value;
                if (!comment.trim()) {
                    Swal.showValidationMessage('Vui lòng nhập nhận xét!');
                    return false;
                }
                return { rating: selectedRating, comment: comment };
            }
        });

        if (formValues) {
            try {
                const res = await fetch(`/api/reviews/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formValues)
                });
                const data = await res.json();

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công!',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchAndRenderReviews();
                } else {
                    Swal.fire('Lỗi!', data.message, 'error');
                }
            } catch (err) {
                Swal.fire('Lỗi!', 'Không thể cập nhật liên lạc máy chủ', 'error');
            }
        }
    }

    async function confirmDeleteReview(id) {
        const result = await Swal.fire({
            title: 'Xóa đánh giá?',
            text: "Bạn có chắc chắn muốn xóa đánh giá này không?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/reviews/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();

                if (data.success) {
                    Swal.fire('Đã xóa!', data.message, 'success');
                    fetchAndRenderReviews();
                } else {
                    Swal.fire('Lỗi!', data.message, 'error');
                }
            } catch (err) {
                Swal.fire('Lỗi!', 'Không thể kết nối đến máy chủ', 'error');
            }
        }
    }

    await fetchAndRenderReviews();
}

