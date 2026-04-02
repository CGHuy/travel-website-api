// BookingTour.js - Logic for booking-tour.html
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
    let tourData = null;
    let baseAdultPrice = 0;
    let baseChildPrice = 0;
    let movingAdultPrice = 0;
    let movingChildPrice = 0;

    // Phase 1: Fetch Tour Data
    const fetchTourAndDepartures = async () => {
        try {
            const response = await fetch(`/api/list-tours/${tourId}`);
            const result = await response.json();

            if (result.success && result.data) {
                tourData = result.data;
                renderTourSummary(tourData);
                renderDepartures(); 
            } else {
                alert("Lỗi tải thông tin tour!");
            }
        } catch (error) {
            console.error("Error fetching tour info:", error);
            alert("Lỗi kết nối máy chủ!");
        }
    };

    const renderTourSummary = (tour) => {
        // Display tour info
        document.getElementById("bc-tour-name").innerText = tour.name;
        document.getElementById("tour-name-display").innerText = tour.name;
        document.getElementById("tour-code").innerText = `TOUR-${tour.id.toString().padStart(3, "0")}`;
        document.getElementById("tour-img").src = tour.cover_image;
        document.getElementById("tour-duration").innerText = tour.duration;

        baseAdultPrice = parseFloat(tour.price_default);
        baseChildPrice = parseFloat(tour.price_child);

        document.getElementById('price-adult').innerText = adultPrice.toLocaleString('vi-VN') + ' ₫';
        document.getElementById('price-child').innerText = childPrice.toLocaleString('vi-VN') + ' ₫';

        calculateTotal();
    };

    const renderDepartures = (itineraries) => {
        const select = document.getElementById('departure_id');
        // Simulating some next 3 dates for the demo if real departures don't exist in API
        const dates = [
            { id: 1, date: '15/05/2026', location: 'Sân bay Tân Sơn Nhất' },
            { id: 2, date: '22/05/2026', location: 'Ga Sài Gòn' },
            { id: 3, date: '01/06/2026', location: 'Sân bay Nội Bài' }
        ];

        select.innerHTML = '<option value="">-- Chọn lịch khởi hành phù hợp --</option>' + 
            dates.map(d => `<option value="${d.id}">${d.date} - Khởi hành từ ${d.location}</option>`).join('');
    };

    // Phase 2: Quantity & Calculation Logic
    window.updateQty = (type, change) => {
        const input = document.getElementById(type);
        let current = parseInt(input.value);
        let newVal = current + change;

        if (type === "adults" && newVal < 1) newVal = 1;
        if (type === "children" && newVal < 0) newVal = 0;

        input.value = newVal;
        calculateTotal();
    };

    const calculateTotal = () => {
        const adults = parseInt(document.getElementById("adults").value);
        const children = parseInt(document.getElementById("children").value);

        const total = (adults * adultPrice) + (children * childPrice);
        
        document.getElementById('sum-passengers').innerText = `${adults + children} người`;
        document.getElementById('total-amount').innerText = total.toLocaleString('vi-VN') + ' ₫';
    };

    // Phase 3: Submit Booking Form
    document.getElementById("submitBooking").addEventListener("click", async (e) => {
        e.preventDefault();

        const form = document.getElementById("booking-form");
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            tour_id: tourId,
            contact_name: document.getElementById("contact_name").value,
            contact_phone: document.getElementById("contact_phone").value,
            contact_email: document.getElementById("contact_email").value,
            note: document.getElementById("note").value,
            departure_id: document.getElementById("departure_id").value,
            adults: document.getElementById("adults").value,
            children: document.getElementById("children").value,
        };

        // TODO: Call API for saving booking
        console.log("Sending booking data:", formData);
        alert("Cảm ơn bạn! Đã nhận yêu cầu đặt chỗ. Chuyển sang phần thanh toán...");
        // window.location.href = `/payment?booking_id=...`;
    });

    // Start
    fetchTourAndDepartures();
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
