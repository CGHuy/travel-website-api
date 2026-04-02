document.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id');

    if (!tourId) {
        showError('Không tìm thấy mã tour!');
        return;
    }

    // 2. Tải chi tiết tour
    fetchTourDetail(tourId);

    async function fetchTourDetail(id) {
        try {
            const response = await fetch(`/api/list-tours/${id}`);
            const result = await response.json();

            if (result.success && result.data) {
                renderTourDetail(result.data);
            } else {
                showError(result.message || 'Không tìm thấy thông tin tour');
            }
        } catch (error) {
            console.error('Error fetching tour detail:', error);
            showError('Lỗi kết nối máy chủ!');
        }
    }

    function renderTourDetail(tour) {
        // --- Thông tin cơ bản ---
        document.title = `${tour.name} - VietTour`;
        document.getElementById('tour-name').innerText = tour.name;
        document.getElementById('breadcrumb-tour-name').innerText = tour.name;
        document.getElementById('tour-location').innerText = tour.location;
        document.getElementById('tour-duration').innerText = tour.duration;
        document.getElementById('tour-region').innerText = tour.region;
        document.getElementById('tour-description').innerHTML = tour.description.replace(/\n/g, '<br><br>');
        
        // Giá tiền chính
        const adultPrice = parseInt(tour.price_default).toLocaleString('vi-VN');
        const childPrice = parseInt(tour.price_child).toLocaleString('vi-VN');

        document.getElementById('tour-price').innerText = adultPrice;
        
        // Cập nhật bảng biểu giá (Sidebar)
        if(document.getElementById('tour-price-summary')) {
            document.getElementById('tour-price-summary').innerText = adultPrice + ' ₫';
        }
        if(document.getElementById('tour-price-child-summary')) {
            document.getElementById('tour-price-child-summary').innerText = childPrice + ' ₫';
        }

        // --- Render Image Gallery kiểu Airbnb ---
        const galleryContainer = document.getElementById('tour-gallery');
        let allImages = [];
        
        // Gộp ảnh cover và các ảnh thành phần
        if(tour.cover_image) allImages.push(tour.cover_image);
        if(tour.images && tour.images.length > 0) {
            tour.images.forEach(i => {
                if(i.image !== tour.cover_image) allImages.push(i.image); // Tránh trùng lặp 100% (nếu có)
            });
        }
        
        if (allImages.length === 0) allImages.push('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070'); // Fallback
        
        // Render
        if (allImages.length === 1) {
            // Có 1 ảnh duy nhất
            galleryContainer.innerHTML = `<img src="${allImages[0]}" class="w-100 h-100 object-fit-cover rounded-4" alt="${tour.name}">`;
        } else {
            // Có nhiều ảnh
            let gridHtml = '';
            const subImages = allImages.slice(1, 5); // Tối đa 4 ảnh phụ
            
            subImages.forEach((img, idx) => {
                gridHtml += `
                    <div class="gallery-grid-item">
                        <img src="${img}" alt="Gallery image ${idx+1}">
                    </div>
                `;
            });

            galleryContainer.innerHTML = `
                <div class="row g-2 h-100 position-relative">
                    <div class="col-12 col-md-6 h-100">
                        <div class="gallery-main">
                            <img src="${allImages[0]}" alt="${tour.name} main cover">
                        </div>
                    </div>
                    <div class="col-12 col-md-6 h-100 d-none d-md-block">
                        <div class="gallery-grid">
                            ${gridHtml}
                        </div>
                    </div>
                </div>
            `;
        }

        // --- Render Services ---
        const serviceList = document.getElementById('service-list');
        if (tour.services && tour.services.length > 0) {
            // Chọn ngẫu nhiên vài icon bootstrap cho sinh động nếu không có trường icon
            const icons = ['fa-solid fa-utensils', 'fa-solid fa-car', 'fa-solid fa-wifi', 'fa-solid fa-spa', 'fa-solid fa-ticket', 'fa-solid fa-person-hiking'];
            
            serviceList.innerHTML = tour.services.map((svc, idx) => `
                <div class="col-md-6">
                    <div class="service-card d-flex gap-3">
                        <div class="icon-box flex-shrink-0">
                            <i class="${icons[idx % icons.length]}"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-1 text-dark">${svc.name}</h6>
                            <p class="text-muted small mb-0">${svc.description || 'Tiện ích tiêu chuẩn'}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            serviceList.innerHTML = '<p class="text-muted">Đang cập nhật dịch vụ...</p>';
        }

        // --- Render Lịch trình (Itineraries) ---
        const itineraryList = document.getElementById('itinerary-list');
        if (tour.itineraries && tour.itineraries.length > 0) {
            itineraryList.innerHTML = tour.itineraries.map((item, idx) => {
                // Formatting title for visual
                let title = item.title || `Ngày ${item.day_number}: Trải nghiệm khám phá`;
                let desc = item.description || '';
                
                return `
                <div class="itinerary-item">
                    <span class="itinerary-number">${item.day_number}</span>
                    <div class="card border-0 shadow-sm p-4 rounded-4 bg-white" style="border: 1px solid #e2e8f0 !important;">
                        <h5 class="fw-bold text-dark mb-3">${title}</h5>
                        <p class="text-secondary mb-0" style="text-align: justify; font-size: 0.95rem; line-height: 1.7;">
                            ${desc.replace(/\n\n/g, '</p><p class="text-secondary mb-0" style="text-align: justify; font-size: 0.95rem; line-height: 1.7;">').replace(/\n/g, '<br>')}
                        </p>
                    </div>
                </div>
            `}).join('');
        } else {
            itineraryList.innerHTML = '<p class="text-muted">Lịch trình đang được liên hệ trực tiếp.</p>';
        }

        // --- Render Đánh giá (Reviews) ---
        const reviewList = document.getElementById('review-list');
        const totalReviewsSpan = document.getElementById('total-reviews-count');
        const avgRatingSpan = document.getElementById('avg-rating-text');
        const showMoreBtn = document.getElementById('show-all-reviews');

        // Cập nhật thông số thật
        if (totalReviewsSpan) totalReviewsSpan.innerText = `(${tour.total_reviews} lượt)`;
        if (avgRatingSpan) avgRatingSpan.innerHTML = `<i class="fa-solid fa-star text-warning"></i> ${tour.avg_rating}`;

        if (tour.reviews && tour.reviews.length > 0) {
            const initialCount = 2; // Chỉ hiện 2 cái đầu
            
            const renderReviewItem = (rev) => {
                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    stars += `<i class="fa-solid fa-star ${i <= rev.rating ? 'text-warning' : 'text-muted opacity-25'}"></i>`;
                }

                return `
                <div class="col-12 review-item-wrapper">
                    <div class="review-card shadow-sm">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="d-flex align-items-center gap-3">
                                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 48px; height: 48px;">
                                    ${rev.user_name.charAt(0)}
                                </div>
                                <div>
                                    <h6 class="fw-bold mb-1 text-dark">${rev.user_name}</h6>
                                    <div class="d-flex gap-1" style="font-size: 0.8rem;">
                                        ${stars}
                                    </div>
                                </div>
                            </div>
                            <span class="text-muted small">${new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p class="text-secondary mb-0 lh-base" style="font-size: 0.95rem;">
                            ${rev.comment}
                        </p>
                    </div>
                </div>`;
            };

            // Render ban đầu
            reviewList.innerHTML = tour.reviews.slice(0, initialCount).map(renderReviewItem).join('');

            // Ẩn/hiện nút "Xem thêm"
            if (tour.reviews.length <= initialCount) {
                if (showMoreBtn) showMoreBtn.style.display = 'none';
            } else {
                if (showMoreBtn) {
                    showMoreBtn.style.display = 'inline-block';
                    showMoreBtn.innerText = `Hiện tất cả ${tour.reviews.length} đánh giá`;
                    
                    showMoreBtn.onclick = () => {
                        reviewList.innerHTML = tour.reviews.map(renderReviewItem).join('');
                        showMoreBtn.style.display = 'none';
                    };
                }
            }
        } else {
            reviewList.innerHTML = '<div class="col-12 text-center py-4"><p class="text-muted">Chưa có đánh giá nào cho tour này.</p></div>';
            if (showMoreBtn) showMoreBtn.style.display = 'none';
        }
    }

    function showError(msg) {
        document.querySelector('main').innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center py-5">
                <img src="https://illustrations.popsy.co/amber/no-results.svg" style="width: 300px; max-width: 100%;" alt="Lỗi">
                <h3 class="fw-bold mt-4 text-dark">${msg}</h3>
                <p class="text-muted text-center" style="max-width: 500px;">Vui lòng kiểm tra lại đường dẫn hoặc quay trở về trang danh sách tour.</p>
                <a href="/list-tour" class="btn btn-primary btn-lg rounded-pill px-5 mt-3 fw-bold">Trở về Danh Sách Tour</a>
            </div>
        `;
    }
});
