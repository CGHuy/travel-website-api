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

        // Map Save button
        const saveBtn = document.getElementById('save-status-btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const status = document.getElementById('booking-status-select').value;
                const payment_status = document.getElementById('payment-status-select').value;
                
                try {
                    const updateRes = await fetch(`/api/bookings/${bookingId}/status`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ status, payment_status })
                    });
                    
                    if (updateRes.ok) {
                        alert('Cập nhật trạng thái thành công!');
                        window.location.reload(); // Refresh to see updated history & UI
                    } else {
                        throw new Error('Lỗi cập nhật');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Không thể cập nhật trạng thái');
                }
            };
        }

    } catch (error) {
        console.error('Error fetching booking details:', error);
    }
};

function renderAdminBookingDetails(data) {
    if (!data) return;

    // Header & Title
    const titleEl = document.getElementById('booking-id-title');
    if (titleEl) {
        // Trạng thái chính của Booking
        const bStatusClass = getStatusClass(data.status);
        const bStatusText = getStatusText(data.status);

      
        titleEl.innerHTML = `
            Booking #BOK${String(data.id).padStart(3, '0')} 
            <span class="status-badge ${bStatusClass}">${bStatusText}</span>
           
        `;
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

    // Refund logic
    const refundCard = document.getElementById('refund-receipt-card');
    if (refundCard) {
        if (data.status === 'cancelled' && data.payment_status === 'refunded') {
            refundCard.style.display = 'block';
            setElText('refund-id', `REF-BOK${String(data.id).padStart(3, '0')}`);
            setElText('refund-amount', totalP);
            setElText('refund-date', formatDate(data.updated_at));
        } else {
            refundCard.style.display = 'none';
        }
    }

    // Activity History
    renderActivityHistory(data);

    // Status selects
    const statusSelect = document.getElementById('booking-status-select');
    if (statusSelect) statusSelect.value = data.status || 'confirmed';
    const paymentSelect = document.getElementById('payment-status-select');
    if (paymentSelect) paymentSelect.value = data.payment_status || 'paid';

    // Handle Cancellation UI Logic
    const cancelActionArea = document.getElementById('cancellation-action-area');
    const modal = document.getElementById('cancel-confirm-modal');
    
    if (cancelActionArea && data.status === 'pending') {
        cancelActionArea.style.display = 'block';
        
        // Modal Event Listeners
        const showModalBtn = document.getElementById('btn-show-cancel-modal');
        const closeModalX = modal.querySelector('.close-modal');
        const closeModalBtn = document.getElementById('btn-close-modal');
        const approveBtn = document.getElementById('btn-approve-cancel');
        const rejectBtn = document.getElementById('btn-reject-cancel');
        const refundAmtEl = document.getElementById('modal-refund-amount');

        if (refundAmtEl) refundAmtEl.textContent = formatCurrency(data.total_price);

        showModalBtn.onclick = () => modal.style.display = 'flex';
        closeModalX.onclick = () => modal.style.display = 'none';
        closeModalBtn.onclick = () => modal.style.display = 'none';
        
        // 1. Logic Phê Duyệt
        approveBtn.onclick = async () => {
            if (!confirm('Xác nhận phê duyệt hủy và hoàn tiền?')) return;
            
            setLoading(approveBtn, true);
            rejectBtn.disabled = true;
            
            try {
                const response = await fetch(`/api/bookings/${data.id}/status`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.token}` 
                    },
                    body: JSON.stringify({ 
                        status: 'cancelled', 
                        payment_status: 'refunded' 
                    })
                });

                if (response.ok) {
                    alert('Đã phê duyệt hủy tour và hoàn tiền cho khách hàng.');
                    window.location.reload();
                } else {
                    throw new Error('Lỗi phê duyệt');
                }
            } catch (err) {
                console.error(err);
                alert('Không thể thực hiện phê duyệt');
                setLoading(approveBtn, false, 'Phê duyệt & Hoàn tiền');
                rejectBtn.disabled = false;
            }
        };

        // 2. Logic Từ Chối
        rejectBtn.onclick = async () => {
            if (!confirm('Bạn chắc chắn muốn TỪ CHỐI yêu cầu hủy này? Đơn hàng sẽ quay lại trạng thái Đã xác nhận.')) return;

            setLoading(rejectBtn, true);
            approveBtn.disabled = true;

            try {
                const response = await fetch(`/api/bookings/${data.id}/status`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.token}` 
                    },
                    body: JSON.stringify({ 
                        status: 'confirmed', 
                        payment_status: 'paid' 
                    })
                });

                if (response.ok) {
                    alert('Đã từ chối yêu cầu hủy. Đơn hàng hiện đã quay lại trạng thái Đã xác nhận.');
                    window.location.reload();
                } else {
                    throw new Error('Lỗi từ chối');
                }
            } catch (err) {
                console.error(err);
                alert('Không thể thực hiện từ chối yêu cầu');
                setLoading(rejectBtn, false, 'Từ chối yêu cầu');
                approveBtn.disabled = false;
            }
        };
    } else if (cancelActionArea) {
        cancelActionArea.style.display = 'none';
    }
}

function renderActivityHistory(data) {
    const historyContainer = document.getElementById('det-history');
    if (!historyContainer) return;

    // Giả lập lịch sử dựa trên trạng thái hiện tại (Nếu backend chưa có bảng log)
    const history = [
        { time: data.created_at, action: 'Khách hàng khởi tạo đặt tour', type: 'info' }
    ];

    if (data.payment_status !== 'pending' || data.status === 'confirmed') {
        history.push({ time: data.created_at, action: 'Thanh toán thành công qua Chuyển khoản', type: 'success' });
    }

    if (data.status === 'pending' && data.payment_status === 'pending') {
        history.push({ time: data.updated_at, action: 'Khách hàng đã gửi yêu cầu hủy tour', type: 'warning' });
    }

    if (data.status === 'confirmed') {
        history.push({ time: data.updated_at, action: 'Hệ thống xác nhận booking', type: 'success' });
    }

    if (data.status === 'cancelled') {
        const actionText = data.payment_status === 'refunded' 
            ? 'Nhân viên đã duyệt hủy & Hoàn tiền thành công' 
            : 'Booking đã bị hủy';
        history.push({ time: data.updated_at, action: actionText, type: 'danger' });
    }

    // Hiển thị từ mới nhất đến cũ nhất
    historyContainer.innerHTML = history.reverse().map(item => `
        <div class="history-item ${item.type}">
            <div class="history-content">
                <h5>${item.action}</h5>
                <span>${formatDateTime(item.time)}</span>
            </div>
        </div>
    `).join('');
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '---';
}

function getStatusText(status) {
    switch (status) {
        case 'confirmed': return 'Đã xác nhận';
        case 'pending': return 'Yêu cầu hủy';
        case 'cancelled': return 'Đã hủy';
        default: return status || 'N/A';
    }
}

function getPaymentStatusText(status) {
    switch (status) {
        case 'paid': return 'Đã thanh toán';
        case 'pending': return 'Đang chờ hoàn tiền';
        case 'refunded': return 'Đã hoàn tiền';
        default: return 'Chưa thanh toán';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'confirmed': return 'status-confirmed';
        case 'pending': return 'status-pending';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}

function getPaymentStatusClass(status) {
    switch (status) {
        case 'paid': return 'status-paid-alt';
        case 'pending': return 'status-pending-alt';
        case 'refunded': return 'status-refunded';
        default: return 'status-unpaid';
    }
}

function formatDate(dateString) {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function formatDateTime(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function addDays(date, days) {
    if (!date) return null;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function setLoading(btn, isLoading, defaultText = '') {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
    } else {
        btn.disabled = false;
        btn.innerHTML = defaultText;
    }
}
