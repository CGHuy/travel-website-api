// Main logic to fetch and render tours for list-tour page
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const priceRange = document.getElementById('priceRange');
    const priceMin = document.getElementById('priceMin');
    const tourListContainer = document.getElementById('tour-list');
    const searchInput = document.getElementById('searchInput');
    const regionSelect = document.getElementById('regionSelect');
    const sortSelect = document.getElementById('sort');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const serviceFilterContainer = document.getElementById('service-filter-container');
    const paginationContainer = document.getElementById('pagination-container');

    let currentFilters = {
        page: 1,
        limit: 6
    };

    if (!tourListContainer) return;

    // Debounce function to limit API calls during rapid input
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Phase 1: Fetch and Render Services for Filter Sidebar
    const fetchServices = async () => {
        try {
            const response = await fetch('/api/list-tours/services');
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                renderServiceFilters(result.data);
            } else {
                serviceFilterContainer.innerHTML = '<div class="text-muted small">Không có dịch vụ</div>';
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            serviceFilterContainer.innerHTML = '<div class="text-danger small">Lỗi tải dịch vụ</div>';
        }
    };

    const renderServiceFilters = (services) => {
        serviceFilterContainer.innerHTML = services.map(service => `
            <div class="form-check custom-checkbox">
                <input class="form-check-input rounded border-secondary service-checkbox auto-filter" type="checkbox" id="svc${service.id}" value="${service.id}">
                <label class="form-check-label fw-medium text-secondary" for="svc${service.id}">${service.name}</label>
            </div>
        `).join('');

        // Add listeners to newly created service checkboxes
        document.querySelectorAll('.service-checkbox').forEach(cb => {
            cb.addEventListener('change', () => fetchTours(1));
        });
    };

    // Phase 2: Fetch and Render Tours
    const fetchTours = async (page = 1) => {
        currentFilters.page = page;
        
        // Show loading state
        tourListContainer.innerHTML = `
            <div class="text-center py-5 w-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted fw-medium">Đang tìm kiếm tour phù hợp...</p>
            </div>
        `;

        // Collect filter values
        const params = new URLSearchParams();
        params.append('page', currentFilters.page);
        params.append('limit', currentFilters.limit);

        if (searchInput && searchInput.value) params.append('search', searchInput.value);
        if (priceRange && priceRange.value) params.append('max_price', priceRange.value);
        if (regionSelect && regionSelect.value) params.append('region', regionSelect.value);
        if (sortSelect && sortSelect.value) params.append('sort', sortSelect.value);

        // Get selected duration
        const selectedDuration = document.querySelector('input[name="duration"]:checked');
        if (selectedDuration && selectedDuration.id !== 'dur_all') {
            params.append('duration', selectedDuration.id);
        }

        // Get selected services
        const selectedServices = Array.from(document.querySelectorAll('.service-checkbox:checked'))
                                     .map(cb => cb.value);
        if (selectedServices.length > 0) params.append('services', selectedServices.join(','));

        try {
            const response = await fetch(`/api/list-tours?${params.toString()}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                renderTours(result.data);
                renderPagination(result.pagination);
            } else {
                tourListContainer.innerHTML = `
                    <div class="text-center py-5 bg-white rounded-4 shadow-sm border border-light w-100">
                        <img src="https://illustrations.popsy.co/amber/no-results.svg" style="width: 200px; opacity: 0.8;" alt="No results">
                        <h4 class="fw-bold text-dark mt-4">Không tìm thấy tour nào</h4>
                        <p class="text-muted mx-auto" style="max-width: 400px;">Rất tiếc, chúng tôi không tìm thấy kết quả phù hợp với tiêu chí của bạn. Vui lòng thử lại với bộ lọc khác.</p>
                        <button class="btn btn-outline-primary rounded-pill px-4 mt-2" onclick="clearFilters()">Xóa tất cả bộ lọc</button>
                    </div>
                `;
                paginationContainer.innerHTML = '';
            }
        } catch (error) {
            console.error('Error fetching tours:', error);
            tourListContainer.innerHTML = '<div class="alert alert-danger w-100">Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</div>';
        }
    };

    const renderTours = (tours) => {
        tourListContainer.innerHTML = tours.map(tour => `
            <div class="card border border-light shadow-sm overflow-hidden bg-white tour-horizontal-card mb-4" style="border-radius: 12px; transition: all 0.2s ease;">
                <div class="row g-0 flex-column flex-md-row h-100">
                    <div class="col-md-5 col-xl-4 position-relative h-100">
                        <img src="${tour.cover_image || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070'}" class="img-fluid w-100 h-100 object-fit-cover" style="min-height: 260px;" alt="${tour.name}">
                        <button class="btn btn-icon position-absolute top-0 start-0 m-3 p-0 bg-transparent border-0 text-white fs-4" style="text-shadow: 0 2px 4px rgba(0,0,0,0.6);">
                            <i class="fa-solid fa-heart opacity-75"></i>
                        </button>
                        ${tour.price_default > 10000000 ? `
                        <span class="badge bg-danger position-absolute bottom-0 start-0 m-3 px-3 py-2 fs-6 rounded-1">
                            <i class="fa-regular fa-gem me-1"></i> Cao cấp
                        </span>` : ''}
                    </div>
                    <div class="col-md-7 col-xl-8">
                        <div class="card-body p-4 pt-3 pb-3 d-flex flex-column h-100">
                            <h4 class="card-title fw-bold mb-3 text-dark line-clamp-2" style="font-size: 1.25rem; line-height: 1.4;">
                                ${tour.name}
                            </h4>
                            
                            <div class="row g-2 mb-3 text-dark" style="font-size: 0.9rem;">
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-ticket text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Mã tour:</span> 
                                    <span class="fw-bold">TOUR${tour.id.toString().padStart(3, '0')}</span>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-location-dot text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Khởi hành:</span> 
                                    <span class="text-primary fw-medium">${tour.location}</span>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-regular fa-clock text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Thời gian:</span> 
                                    <span class="fw-bold">${tour.duration}</span>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-map-marked-alt text-muted" style="width: 18px; text-align: center;"></i>
                                    <span class="text-secondary">Khu vực:</span> 
                                    <span class="fw-medium">${tour.region}</span>
                                </div>
                            </div>

                            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-light flex-wrap">
                                <i class="fa-regular fa-calendar-days text-muted"></i>
                                <span class="fw-medium text-dark text-nowrap">Ngày khởi hành:</span>
                                <div class="d-flex gap-2 flex-nowrap overflow-hidden ms-2">
                                    ${(tour.upcoming_dates || 'Liên hệ').split(',').map(date => `
                                        <span class="border border-danger text-danger px-2 py-1 rounded bg-white" style="font-size: 0.8rem; cursor: pointer;">${date}</span>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-end mt-auto pt-1">
                                <div>
                                    <span class="text-dark d-block mb-1" style="font-size: 0.9rem;">Giá từ:</span>
                                    <span class="fw-bold text-danger" style="font-size: 1.5rem;">${parseInt(tour.price_default).toLocaleString('vi-VN')} <span class="text-decoration-underline" style="font-size: 1.2rem;">đ</span></span>
                                </div>
                                <a href="/tour-detail/${tour.slug}" class="btn btn-primary px-4 shadow-sm rounded-2" style="font-weight: 500; font-size: 0.95rem; padding-top: 8px; padding-bottom: 8px; background-color: #0b5ed7;">Xem chi tiết</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const renderPagination = (pagination) => {
        const { currentPage, totalPages } = pagination;
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        let html = '';

        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center ${currentPage === 1 ? 'text-muted' : 'text-dark'}" 
                   href="javascript:void(0)" onclick="changePage(${currentPage - 1})" style="width: 45px; height: 45px;">
                    <i class="fa-solid fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center fw-bold fs-6 ${currentPage === i ? '' : 'text-dark'}" 
                       href="javascript:void(0)" onclick="changePage(${i})" style="width: 45px; height: 45px;">
                        ${i}
                    </a>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center ${currentPage === totalPages ? 'text-muted' : 'text-dark'}" 
                   href="javascript:void(0)" onclick="changePage(${currentPage + 1})" style="width: 45px; height: 45px;">
                    <i class="fa-solid fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = html;
    };

    // Global helper functions
    window.changePage = (page) => {
        fetchTours(page);
        window.scrollTo({ top: document.querySelector('.main-container').offsetTop - 100, behavior: 'smooth' });
    };

    window.clearFilters = () => {
        if (searchInput) searchInput.value = '';
        if (priceRange) {
            priceRange.value = 10000000;
            priceMin.innerText = '10.000.000đ';
        }
        if (regionSelect) regionSelect.value = '';
        if (sortSelect) sortSelect.value = '';
        document.getElementById('dur_all').checked = true;
        document.querySelectorAll('.service-checkbox').forEach(cb => cb.checked = false);
        fetchTours(1);
    };

    // Event Listeners with Debounce and Auto-Trigger
    const debouncedFetch = debounce(() => fetchTours(1), 500);

    if (priceRange && priceMin) {
        priceRange.addEventListener('input', function() {
            priceMin.innerText = parseInt(this.value).toLocaleString('vi-VN') + 'đ';
            debouncedFetch();
        });
    }

    if (regionSelect) {
        regionSelect.addEventListener('change', () => fetchTours(1));
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => fetchTours(1));
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => debouncedFetch());
    }

    // Listen to duration radio buttons
    document.querySelectorAll('input[name="duration"]').forEach(radio => {
        radio.addEventListener('change', () => fetchTours(1));
    });

    if (applyFilterBtn) {
        applyFilterBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Làm mới bộ lọc';
        applyFilterBtn.classList.replace('btn-primary', 'btn-outline-secondary');
        applyFilterBtn.addEventListener('click', clearFilters);
    }

    // Initial sequence
    fetchServices().then(() => fetchTours(1));
});
