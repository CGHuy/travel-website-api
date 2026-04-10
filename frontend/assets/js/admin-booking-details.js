window.initAdminBookingDetailsPage = async function() {
    console.log("Initializing Booking Details Page...");
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    const token = localStorage.getItem('token');

    if (!bookingId) {
        console.error("No booking ID found in URL");
        return;
    }

    // Add back button listener for SPA
    const backBtn = document.getElementById('back-to-list');
    if (backBtn) {
        backBtn.onclick = (e) => {
            e.preventDefault();
            history.pushState({ page: 'booking' }, "", "?page=booking");
            window.dispatchEvent(new Event('popstate'));
        };
    }

    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể lấy thông tin booking');

        const { data: booking } = await response.json();
        renderAdminBookingDetails(booking);

    } catch (error) {
        console.error('Error fetching booking details:', error);
    }
};

function renderAdminBookingDetails(data) {
    if (!data) return;

    // Header & Title
    const titleEl = document.getElementById('booking-id-title');
    if (titleEl) {
        titleEl.innerHTML = `Booking #BOK${String(data.id).padStart(3, '0')} <span class="status-badge ${getStatusClass(data.status)}">${getStatusText(data.status)}</span>`;
    }
    const metaEl = document.getElementById('booking-meta-info');
    if (metaEl) {
        metaEl.textContent = `Ngày đặt: ${formatDate(data.created_at)}`;
    }

    // Customer info (Orderer)
    setElText('det-user-id', `USR${String(data.user_id).padStart(3, '0') || 'KHÁCH'}`);
    setElText('det-fullname', data.contact_name || data.user_fullname);
    setElText('det-phone', data.contact_phone || data.user_phone);
    setElText('det-email', data.contact_email || data.user_email);

    // Tour info
    const tourImageEl = document.getElementById('det-tour-image');
    if (tourImageEl && data.tour_image) {
        tourImageEl.src = data.tour_image;
    }
    setElText('det-tour-name', data.tour_name);
    setElText('det-dep-date', formatDate(data.departure_date));
    setElText('det-ret-date', formatDate(data.return_date || addDays(data.departure_date, 3)));
    setElText('det-dep-loc', data.departure_location);
    setElText('det-pax-count', `${data.adults} Người lớn, ${data.children} Trẻ em`);

    // Itinerary Rendering
    const itineraryList = document.getElementById('det-itinerary');
    if (itineraryList && data.itineraries) {
        itineraryList.innerHTML = data.itineraries.map(item => `
            <div class="timeline-item">
                <h5>Ngày ${item.day_number}</h5>
                <p>${item.description}</p>
            </div>
        `).join('');
    }

    // Passenger List Rendering
    const passengerTable = document.getElementById('det-passenger-list');
    const paxTotalEl = document.getElementById('det-pax-total');
    if (passengerTable && data.passengers) {
        paxTotalEl.textContent = data.passengers.length;
        passengerTable.innerHTML = data.passengers.map(p => `
            <tr>
                <td><span class="passenger-name">${p.fullname}</span></td>
                <td>${p.passenger_type === 'adult' ? 'Người lớn' : 'Trẻ em'}</td>
                <td>${p.gender || 'Khác'}</td>
                <td>${p.dob ? formatDate(p.dob) : '-'}</td>
            </tr>
        `).join('');
    }

    // Financials Breakdown
    const priceBreakdown = document.getElementById('det-price-breakdown');
    if (priceBreakdown) {
        const adultPriceTotal = data.adults * (parseFloat(data.price_default) + parseFloat(data.price_moving));
        const childPriceTotal = data.children * (parseFloat(data.price_child) + parseFloat(data.price_moving_child));
        
        priceBreakdown.innerHTML = `
            <div class="summary-item">
                <label>Người lớn (x${data.adults})</label>
                <span>${formatCurrency(adultPriceTotal)}</span>
            </div>
            ${data.children > 0 ? `
            <div class="summary-item">
                <label>Trẻ em (x${data.children})</label>
                <span>${formatCurrency(childPriceTotal)}</span>
            </div>` : ''}
        `;
    }

    const totalP = formatCurrency(data.total_price);
    setElText('det-total-price', totalP);
    setElText('det-collected-amt', totalP);
    setElText('det-payment-meta', `Thanh toán qua: Chuyển khoản - ${formatDate(data.created_at)}`);

    // Status selects
    const statusSelect = document.getElementById('booking-status-select');
    if (statusSelect) statusSelect.value = data.status || 'confirmed';
    const paymentSelect = document.getElementById('payment-status-select');
    if (paymentSelect) paymentSelect.value = data.payment_status || 'paid';
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '---';
}

function getStatusClass(status) {
    switch (status) {
        case 'confirmed': return 'status-confirmed';
        case 'pending': return 'status-pending';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'confirmed': return 'Đã xác nhận';
        case 'pending': return 'Chờ xử lý';
        case 'cancelled': return 'Đã hủy';
        default: return status || 'N/A';
    }
}

function formatDate(dateString) {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function addDays(date, days) {
    if (!date) return null;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
