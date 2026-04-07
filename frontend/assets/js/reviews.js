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
    
    // Handle static items
    const staticLinks = document.querySelectorAll(".nav-item-static a");
    staticLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath.includes(href)) {
            link.style.color = "#3b82f6";
            link.querySelector("span").style.fontWeight = "700";
            link.querySelector("i").style.color = "#3b82f6";
        }
    });

    // Handle normal links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (currentPath.endsWith(href)) {
            link.classList.add("active");
        }
    });
}

function initReviewsPage() {
    console.log("Reviews page initialized");

    const reviewForm = document.getElementById("reviewForm");
    const historyList = document.getElementById("review-history-list");
    const noReviews = document.getElementById("no-reviews");

    // Mock data for initial reviews
    let myReviews = [
        {
            id: 1,
            name: "Ngọc Khánh",
            email: "ngockhanh74dctt23@gmail.com",
            rating: 5,
            comment: "Chuyến đi Đà Lạt vừa rồi thật tuyệt vời! Hướng dẫn viên nhiệt tình, khách sạn sạch sẽ và lịch trình rất hợp lý. Sẽ còn quay lại!",
            date: "15/03/2026"
        },
        {
            id: 2,
            name: "Ngọc Khánh",
            email: "ngockhanh74dctt23@gmail.com",
            rating: 4,
            comment: "Dịch vụ tốt, đồ ăn ngon. Chỉ tiếc là thời tiết hơi mưa vào ngày cuối nhưng bù lại mọi thứ đều hoàn hảo.",
            date: "20/02/2026"
        }
    ];

    // Render history
    function renderHistory() {
        if (myReviews.length === 0) {
            historyList.classList.add("d-none");
            noReviews.classList.remove("d-none");
            return;
        }

        historyList.classList.remove("d-none");
        noReviews.classList.add("d-none");
        historyList.innerHTML = "";

        myReviews.sort((a,b) => b.id - a.id).forEach(review => {
            const card = document.createElement("div");
            card.className = "review-item-card animate__animated animate__fadeInUp";
            
            let starsHtml = "";
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<i class="${i <= review.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i> `;
            }

            card.innerHTML = `
                <div class="review-date"><i class="fa-regular fa-calendar-days me-2"></i> ${review.date}</div>
                <div class="review-stars-static">${starsHtml}</div>
                <div class="review-text">${review.comment}</div>
            `;
            historyList.appendChild(card);
        });
    }

    renderHistory();

    // Form Submission Handling
    if (reviewForm) {
        reviewForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const name = document.getElementById("reviewerName").value;
            const email = document.getElementById("reviewerEmail").value;
            const comment = document.getElementById("reviewComment").value;
            const ratingInput = document.querySelector('input[name="rating"]:checked');

            if (!ratingInput) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Thiếu thông tin',
                    text: 'Vui lòng chọn số sao đánh giá!',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }

            const rating = parseInt(ratingInput.value);

            // Create new review object
            const newReview = {
                id: Date.now(),
                name: name,
                email: email,
                rating: rating,
                comment: comment,
                date: new Date().toLocaleDateString('vi-VN')
            };

            // Add to the beginning of the list
            myReviews.unshift(newReview);
            
            // Show success notification
            Swal.fire({
                icon: 'success',
                title: 'Đã gửi đánh giá!',
                text: 'Cảm ơn bạn đã chia sẻ trải nghiệm với VietTour.',
                timer: 2000,
                showConfirmButton: false
            });

            // Reset form
            reviewForm.reset();
            
            // Re-render history
            renderHistory();
        });
    }
}
