const API_URL = "http://localhost:3000/api";

// Load header và footer, sau đó load dữ liệu tour
document.addEventListener("DOMContentLoaded", async () => {
	await Promise.all([
		loadComponent("header-placeholder", "../components/header.html"),
		loadComponent("footer-placeholder", "../components/footer.html"),
	]);

	loadRegionCategories();
	loadTopFeaturedTours();
	loadToursByRegion("Miền Bắc", "mienBacCarousel", "carouselMienBac");
	loadToursByRegion("Miền Trung", "mienTrungCarousel", "carouselMienTrung");
	loadToursByRegion("Miền Nam", "mienNamCarousel", "carouselMienNam");
});

async function loadComponent(targetId, filePath) {
	const target = document.getElementById(targetId);
	if (!target) return;

	try {
		const res = await fetch(filePath);
		const html = await res.text();
		target.innerHTML = html;

		// Nếu là header, chạy script init sau khi HTML được load
		if (filePath.includes("header.html")) {
			// Tìm và execute script tag có trong HTML
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
	} catch (err) {
		console.error(err);
	}
}

// Format giá VNĐ
function formatPrice(price) {
	return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
}

// Tạo HTML cho tour card (Dạng lưới tiêu chuẩn)
function createTourCard(tour) {
	const images = [
		tour.image || tour.cover_image || "assets/images/default-tour.jpg",
	];
	if (tour.images && Array.isArray(tour.images) && tour.images.length > 0) {
		const otherImages = tour.images.filter(
			(img) => img !== tour.image && img !== tour.cover_image,
		);
		images.push(...otherImages);
	}

	const firstImage = images[0];
	const secondImage = images.length > 1 ? images[1] : firstImage;

	return `
          <div class="col-12 col-md-6 col-lg-3">
               <a href="/detail-tour?id=${tour.id}" class="text-decoration-none">
                    <div class="card h-100 tour-card" 
                         onmouseenter="this.querySelector('.tour-main-img').src='${secondImage}'" 
                         onmouseleave="this.querySelector('.tour-main-img').src='${firstImage}'">
                         <div class="tour-card-img-wrapper">
                              <img src="${firstImage}" 
                                   class="card-img-top tour-main-img" 
                                   alt="${tour.name}">
                         </div>
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

// Tạo HTML cho Top Tour card (Dạng Overlay - Vietravel style)
function createTopTourCard(tour) {
	const imageUrl =
		tour.image || tour.cover_image || "assets/images/default-tour.jpg";

	return `
        <div class="col-12 col-md-6 col-lg-3">
            <a href="/detail-tour?id=${tour.id}" class="text-decoration-none">
                <div class="card top-tour-card">
                    <img src="${imageUrl}" class="card-img-top" alt="${tour.name}">
                    <div class="top-tour-overlay">
                        <h5>${tour.name}</h5>
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
function renderCarousel(
	tours,
	containerId,
	carouselId,
	cardCreator = createTourCard,
) {
	const container = document.getElementById(containerId);
	const carousel = document.getElementById(carouselId);
	const loading = document.getElementById(
		`loading${carouselId.replace("carousel", "")}`,
	);

	if (loading) loading.style.display = "none";

	if (!tours || tours.length === 0) {
		container.innerHTML = `
               <div class="carousel-item active">
                    <div class="alert alert-info">Chưa có tour nào!</div>
               </div>
          `;
		carousel.classList.remove("d-none");
		return;
	}

	const chunks = chunkArray(tours, 4);
	container.innerHTML = chunks
		.map(
			(chunk, idx) => `
          <div class="carousel-item ${idx === 0 ? "active" : ""}">
               <div class="row g-3">
                    ${chunk.map((tour) => cardCreator(tour)).join("")}
               </div>
          </div>
     `,
		)
		.join("");

	carousel.classList.remove("d-none");
}

// Load 3 thẻ phân loại vùng miền (Vietravel style)
async function loadRegionCategories() {
	const regions = [
		{
			name: "Miền Bắc",
			cardId: "cardMienBac",
			loadingId: "loadingCardMienBac",
		},
		{
			name: "Miền Trung",
			cardId: "cardMienTrung",
			loadingId: "loadingCardMienTrung",
		},
		{
			name: "Miền Nam",
			cardId: "cardMienNam",
			loadingId: "loadingCardMienNam",
		},
	];

	for (const region of regions) {
		try {
			// Lấy tour mới nhất của vùng để làm ảnh đại diện
			const response = await fetch(
				`${API_URL}/tours/region/${encodeURIComponent(region.name)}`,
			);
			const result = await response.json();

			const card = document.getElementById(region.cardId);
			const loading = document.getElementById(region.loadingId);

			// Nếu card có thuộc tính data-static="true", không ghi đè ảnh bằng JS
			if (card.getAttribute("data-static") === "true") {
				if (loading) loading.classList.add("d-none");
				continue;
			}

			if (result.success && result.data.length > 0) {
				const tour = result.data[0];
				const imageUrl =
					tour.cover_image || tour.image || "/assets/images/default-tour.jpg";
				card.querySelector("img").src = imageUrl;
			}

			if (loading) loading.classList.add("d-none");
		} catch (error) {
			console.error(`Lỗi khi load ảnh vùng ${region.name}:`, error);
			const loading = document.getElementById(region.loadingId);
			if (loading) loading.classList.add("d-none");
		}
	}
}

// Load tours theo vùng miền
async function loadToursByRegion(region, containerId, carouselId) {
	try {
		const response = await fetch(
			`${API_URL}/tours/region/${encodeURIComponent(region)}`,
		);
		const data = await response.json();

		if (data.success) {
			renderCarousel(data.data, containerId, carouselId);
		}
	} catch (error) {
		console.error(`Lỗi khi load tours ${region}:`, error);
		const loading = document.getElementById(
			`loading${carouselId.replace("carousel", "")}`,
		);
		if (loading) {
			loading.innerHTML = `<div class="alert alert-danger">Không thể tải dữ liệu ${region}</div>`;
		}
	}
}
// Load Top Featured Tours (Vietravel style carousel)
async function loadTopFeaturedTours() {
	try {
		const response = await fetch(`${API_URL}/tours`);
		const data = await response.json();

		if (data.success) {
			renderCarousel(
				data.data,
				"topFeaturedCarousel",
				"carouselTopFeatured",
				createTopTourCard,
			);
			const loading = document.getElementById("loadingTopFeatured");
			if (loading) loading.style.display = "none";
		}
	} catch (error) {
		console.error("Lỗi khi load top featured tours:", error);
		const loading = document.getElementById("loadingTopFeatured");
		if (loading) {
			loading.innerHTML = `
                    <div class="alert alert-danger">Không thể tải dữ liệu tour nổi bật.</div>
               `;
		}
	}
}
