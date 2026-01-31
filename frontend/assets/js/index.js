// API Configuration
const API_URL = 'http://localhost:3000/api';

// Load external component HTML into placeholder
async function loadComponent(targetId, filePath) {
     const target = document.getElementById(targetId);
     if (!target) return;

     try {
          const res = await fetch(filePath);
          const html = await res.text();
          target.innerHTML = html;
     } catch (err) {
          console.error(`Không thể load component ${filePath}:`, err);
     }
}

// Format giá VNĐ
function formatPrice(price) {
     return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
}

// Tạo HTML cho tour card
function createTourCard(tour) {
     return `
          <div class="col-12 col-md-6 col-lg-3">
               <a href="tour-detail.html?id=${tour.id}" class="text-decoration-none">
                    <div class="card h-100 tour-card">
                         <img src="${tour.image || tour.cover_image || 'assets/images/default-tour.jpg'}" 
                              class="card-img-top" 
                              alt="${tour.name}">
                         <div class="card-badges">
                         <span class="badge bg-info">
                              <i class="fa-solid fa-map-location-dot"></i>
                              ${tour.location || tour.region}
                         </span>
                         <span class="badge bg-primary">
                              <i class="fa-solid fa-calendar-days"></i>
                              ${tour.duration}
                         </span>
                         </div>
                         <div class="card-body">
                         <h5 class="card-title">${tour.name}</h5>
                         <p class="card-text">${tour.description}</p>
                         <div class="card-price">
                              <b>Giá:</b>
                              <span class="hightlight_price">${formatPrice(tour.price || tour.price_default)}</span>
                         </div>
                         </div>
                    </div>
            </a>
        </div>
    `;
}

// Chia mảng tours thành các nhóm (chunks)
function chunkArray(array, size) {
     const chunks = [];
     for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
     }
     return chunks;
}

// Render carousel
function renderCarousel(tours, containerId, carouselId) {
     const container = document.getElementById(containerId);
     const carousel = document.getElementById(carouselId);
     const loading = document.getElementById(`loading${carouselId.replace('carousel', '')}`);

     if (loading) loading.style.display = 'none';

     if (!tours || tours.length === 0) {
          container.innerHTML = `
               <div class="carousel-item active">
                    <div class="alert alert-info">Chưa có tour nào!</div>
               </div>
          `;
          carousel.classList.remove('d-none');
          return;
     }

     const chunks = chunkArray(tours, 4);
     container.innerHTML = chunks.map((chunk, idx) => `
          <div class="carousel-item ${idx === 0 ? 'active' : ''}">
               <div class="row g-3">
                    ${chunk.map(tour => createTourCard(tour)).join('')}
               </div>
          </div>
     `).join('');

     carousel.classList.remove('d-none');
}

// Load tất cả tours
async function loadTopTours() {
     try {
          const response = await fetch(`${API_URL}/tours`);
          const data = await response.json();

          if (data.success) {
               renderCarousel(data.data, 'topToursCarousel', 'carouselTourCards');
               const loadingTop = document.getElementById('loadingTop');
               if (loadingTop) loadingTop.style.display = 'none';
          }
     } catch (error) {
          console.error('Lỗi khi load top tours:', error);
          const loadingTop = document.getElementById('loadingTop');
          if (loadingTop) {
               loadingTop.innerHTML = `
                    <div class="alert alert-danger">Không thể tải dữ liệu. Vui lòng thử lại!</div>
               `;
          }
     }
}

// Load tours theo vùng miền
async function loadToursByRegion(region, containerId, carouselId) {
     try {
          const response = await fetch(`${API_URL}/tours/region/${encodeURIComponent(region)}`);
          const data = await response.json();

          if (data.success) {
               renderCarousel(data.data, containerId, carouselId);
          }
     } catch (error) {
          console.error(`Lỗi khi load tours ${region}:`, error);
          const loading = document.getElementById(`loading${carouselId.replace('carousel', '')}`);
          if (loading) {
               loading.innerHTML = `<div class="alert alert-danger">Không thể tải dữ liệu ${region}</div>`;
          }
     }
}

// Search tours
document.getElementById('searchForm').addEventListener('submit', async (e) => {
     e.preventDefault();
     const keyword = document.getElementById('searchInput').value.trim();

     if (!keyword) {
          alert('Vui lòng nhập từ khóa tìm kiếm!');
          return;
     }

     // Redirect to search results page or handle inline
     window.location.href = `tours.html?search=${encodeURIComponent(keyword)}`;
});

// Load header và footer, sau đó load dữ liệu tour
document.addEventListener('DOMContentLoaded', async () => {
     await Promise.all([
          loadComponent('header-placeholder', '../components/header.html'),
          loadComponent('footer-placeholder', '../components/footer.html'),
     ]);

     loadTopTours();
     loadToursByRegion('Miền Bắc', 'mienBacCarousel', 'carouselMienBac');
     loadToursByRegion('Miền Trung', 'mienTrungCarousel', 'carouselMienTrung');
     loadToursByRegion('Miền Nam', 'mienNamCarousel', 'carouselMienNam');
});
