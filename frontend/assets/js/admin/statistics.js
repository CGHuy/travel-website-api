const API = "";
let revenueChart = null;
let statusChart = null;

// --- Định dạng hiển thị ---
const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat("vi-VN").format(n);
const $ = (id) => document.getElementById(id);

function growthBadge(pct) {
	const val = parseFloat(pct);
	if (isNaN(val) || val === 0) return '<span class="tb-growth-tag neutral">0%</span>';
	const up = val > 0;
	const cls = up ? "up" : "down";
	const icon = up ? "▲" : "▼";
	const label = (val === 100) ? "Mới" : `${Math.abs(val)}%`;
	return `<span class="tb-growth-tag ${cls}">${icon} ${label}</span>`;
}

function statusLabel(status) {
	const map = { confirmed: ["Đã xác nhận", "confirmed"], pending: ["Chờ xử lý", "pending"], cancelled: ["Đã huỷ", "cancelled"], open: ["Đang mở", "open"], closed: ["Đã đóng", "closed"], full: ["Đã đầy", "full"] };
	const [label, cls] = map[status] || [status, ""];
	return `<span class="status-badge status-${cls}">${label}</span>`;
}

// --- Xử lý thời gian ---
function getDateRange(period) {
	const now = new Date();
	const today = now.toISOString().split("T")[0];
	let from, to;

	switch (period) {
		case "today": from = to = today; break;
		case "7days": 
			to = today;
			const d7 = new Date(); d7.setDate(d7.getDate() - 6);
			from = d7.toISOString().split("T")[0];
			break;
		case "month": 
			from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
			to = today;
			break;
		case "year": 
			from = `${now.getFullYear()}-01-01`;
			to = today;
			break;
		default: from = to = today;
	}
	return { from, to };
}

function getPeriodLabel(period, from, to) {
	const map = { today: "Hôm nay", "7days": "7 ngày qua", month: `Tháng ${new Date().getMonth() + 1}`, year: `Năm ${new Date().getFullYear()}` };
	return map[period] || `${from} → ${to}`;
}

// --- Khởi tạo Biểu đồ ---
function initRevenueChart(labels, data) {
	try {
		const canvas = $("revenueChart");
		if (!canvas) return;
		if (typeof Chart === "undefined") return;

		const ctx = canvas.getContext("2d");
		if (revenueChart) revenueChart.destroy();

		revenueChart = new Chart(ctx, {
			type: "bar",
			data: {
				labels,
				datasets: [
					{ label: "Doanh thu", data, backgroundColor: "rgba(59,130,246,0.18)", borderColor: "#3b82f6", borderWidth: 2, borderRadius: 8, order: 2 },
					{ label: "Xu hướng", data, type: "line", borderColor: "#8b5cf6", borderWidth: 2.5, pointRadius: 4, tension: 0.4, yAxisID: "y", order: 1 }
				]
			},
			options: {
				responsive: true, maintainAspectRatio: false,
				plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " " + fmt(c.raw) } } },
				scales: { y: { beginAtZero: true, ticks: { callback: (v) => (v >= 1e6 ? (v / 1e6).toFixed(0) + "M" : v) } }, x: { grid: { display: false } } }
			}
		});
	} catch (e) { console.error("Lỗi vẽ biểu đồ doanh thu", e); }
}

function initStatusChart(data) {
	try {
		const canvas = $("bookingStatusChart");
		if (!canvas || typeof Chart === "undefined") return;

		const colors = { confirmed: "#10b981", pending: "#f59e0b", cancelled: "#ef4444" };
		const labels = { confirmed: "Đã xác nhận", pending: "Chờ xử lý", cancelled: "Đã huỷ" };

		if (statusChart) statusChart.destroy();
		statusChart = new Chart(canvas.getContext("2d"), {
			type: "doughnut",
			data: {
				labels: data.map(d => labels[d.status] || d.status),
				datasets: [{ data: data.map(d => d.count), backgroundColor: data.map(d => colors[d.status] || "#94a3b8"), borderWidth: 0 }]
			},
			options: { responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false } } }
		});

		const legend = $("booking-status-legend");
		if (legend) legend.innerHTML = data.map((d, i) => `
			<div class="legend-item">
				<span class="legend-dot" style="background:${colors[d.status] || "#94a3b8"}"></span>
				${labels[d.status] || d.status}: <strong>${d.count}</strong>
			</div>`).join("");
	} catch (e) { console.error("Lỗi vẽ biểu đồ booking", e); }
}

// --- Tải dữ liệu ---
async function loadRealTime() {
	const { data } = await (await fetch(`${API}/api/stats/realtime`)).json();
	$("rt-new-users").textContent = fmtNum(data.new_users_today);
	$("rt-total-users").textContent = `Tổng: ${data.total_users}`;
	$("rt-pending").textContent = data.pending_bookings;
	$("rt-open-tours").textContent = data.open_departures;
	$("rt-total-tours").textContent = `Tổng: ${data.total_tours}`;
}

async function loadOccupancy() {
	const { data } = await (await fetch(`${API}/api/stats/occupancy`)).json();
	const body = $("occupancy-body");
	if (!body) return;

	if (!data.length) {
		body.innerHTML = '<tr><td colspan="6" class="text-center py-4">Chưa có dữ liệu</td></tr>';
		$("rt-avg-occupancy").textContent = "0%";
		return;
	}

	$("rt-avg-occupancy").textContent = (data.reduce((s, d) => s + parseFloat(d.occupancy_rate || 0), 0) / data.length).toFixed(1) + "%";
	body.innerHTML = data.map(d => `
		<tr>
			<td class="text-truncate" style="max-width:180px">${d.tour_name}</td>
			<td>${new Date(d.departure_date).toLocaleDateString("vi-VN")}</td>
			<td>${d.departure_location}</td>
			<td>${d.seats_booked}/${d.seats_total}</td>
			<td>
				<div class="occupancy-bar-wrap">
					<div class="occupancy-bar-track"><div class="occupancy-bar-fill ${d.occupancy_rate >= 80 ? 'high' : ''}" style="width:${Math.min(d.occupancy_rate, 100)}%"></div></div>
					<span class="fw-bold">${d.occupancy_rate}%</span>
				</div>
			</td>
			<td>${statusLabel(d.status)}</td>
		</tr>`).join("");
}

async function loadReport(from, to) {
	const { data } = await (await fetch(`${API}/api/stats/report?from=${from}&to=${to}`)).json();
	$("tb-revenue").textContent = fmt(data.revenue);
	$("tb-bookings").textContent = data.booking_count;
	$("tb-revenue-growth").innerHTML = growthBadge(data.growth.revenue);
	$("tb-booking-growth").innerHTML = growthBadge(data.growth.booking);
	$("tb-revenue-prev").textContent = `Kỳ trước: ${fmt(data.previous.revenue)}`;
	$("tb-booking-prev").textContent = `Kỳ trước: ${data.previous.booking_count} booking`;
}

async function applyFilter(period, cFrom, cTo) {
	const { from, to } = (period === "custom") ? { from: cFrom, to: cTo } : getDateRange(period);
	if ($("time-label")) $("time-label").textContent = getPeriodLabel(period, from, to);
	document.querySelectorAll(".time-filter-btn[data-period]").forEach(b => b.classList.toggle("active", b.dataset.period === period));
	
	const resRev = await (await fetch(`${API}/api/stats/revenue?from=${from}&to=${to}`)).json();
	initRevenueChart(resRev.data.labels, resRev.data.data);
	
	const resStatus = await (await fetch(`${API}/api/stats/bookings/status?from=${from}&to=${to}`)).json();
	initStatusChart(resStatus.data);
	
	loadReport(from, to);
}

// --- Analytics ---
async function loadAnalytics() {
	const [tours, reviews, users] = await Promise.all([
		fetch(`${API}/api/stats/tours/top`).then(r => r.json()),
		fetch(`${API}/api/stats/reviews`).then(r => r.json()),
		fetch(`${API}/api/stats/users`).then(r => r.json())
	]);

	$("top-tours-body").innerHTML = tours.data.map((t, i) => `
		<tr>
			<td><span class="tour-rank ${i < 3 ? `rank-${i+1}` : 'rank-other'}">${i+1}</span></td>
			<td class="text-truncate" style="max-width:200px">${t.name}</td>
			<td><span class="region-badge">${t.region}</span></td>
			<td><b>${t.total_bookings}</b> đặt</td>
			<td class="text-primary fw-bold">${fmt(t.total_revenue)}</td>
			<td><div class="star-rating"><i class="fa-solid fa-star"></i> ${t.avg_rating} <small>(${t.review_count})</small></div></td>
		</tr>`).join("");

	const { overall, top_rated_tours } = reviews.data;
	$("avg-rating-badge").textContent = overall.avg_rating || "0";
	$("total-reviews-label").textContent = `Tổng ${overall.total_reviews} đánh giá`;
	$("rating-bars").innerHTML = [5,4,3,2,1].map(s => {
		const p = ((overall[`star${s}`] || 0) / (overall.total_reviews || 1) * 100).toFixed(1);
		return `<div class="rating-bar-row">
			<span class="rating-bar-label">${s}<i class="fa-solid fa-star"></i></span>
			<div class="rating-bar-track"><div class="rating-bar-fill" style="width:${p}%"></div></div>
			<span class="rating-bar-count">${overall[`star${s}`] || 0}</span>
		</div>`;
	}).join("");

	$("top-rated-list").innerHTML = top_rated_tours.map((t, i) => `
		<div class="top-item">
			<div class="top-item-rank">${i+1}</div>
			<div class="top-item-body"><div class="top-item-name">${t.name}</div><div class="top-item-meta">${t.region} · ${t.review_count} đánh giá</div></div>
			<div class="top-item-value"><span class="text-warning">★</span> ${t.avg_rating}</div>
		</div>`).join("");

	$("top-passengers-list").innerHTML = users.data.top_passengers.map((c, i) => `
		<div class="top-item">
			<div class="top-item-rank">${i+1}</div>
			<div class="top-item-body"><div class="top-item-name">${c.fullname}</div><div class="top-item-meta">${c.email} · ${c.booking_count} booking</div></div>
			<div class="top-item-value">${fmt(c.total_spent)}<small>Chi tiêu</small></div>
		</div>`).join("");
}

// --- Khởi tạo trang ---
window.initAdminStatisticsPage = async () => {
	loadRealTime(); loadOccupancy(); loadAnalytics();
	applyFilter("month");

	document.querySelectorAll(".time-filter-btn[data-period]").forEach(b => b.onclick = () => applyFilter(b.dataset.period));
	if ($("filter-apply")) $("filter-apply").onclick = () => applyFilter("custom", $("filter-from").value, $("filter-to").value);
};
