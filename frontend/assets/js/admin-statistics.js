/* =============================================
   ADMIN STATISTICS — JavaScript
   ============================================= */

const API = "";

// Load header và footer nếi truy cập trực tiếp (không thông qua dashboard)
document.addEventListener("DOMContentLoaded", async () => {
	// Kiểm tra nếu không có div #admin-content thì mới load header/footer (nghĩa là đang ở trang standalone)
	if (!document.getElementById("admin-content")) {
		await Promise.all([
			loadComponent("header-placeholder", "../../components/header.html"),
			loadComponent("footer-placeholder", "../../components/footer.html")
		]);
		initAdminStatisticsPage();
	}
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

// ─── Helpers ───────────────────────────────────
const fmt = (n) =>
	new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat("vi-VN").format(n);
const $ = (id) => document.getElementById(id);

function growthBadge(pct) {
	if (pct === null) return '<span class="kpi-badge kpi-badge-neutral">— Chưa có dữ liệu</span>';
	const up = parseFloat(pct) >= 0;
	const cls = up ? "up" : "down";
	const icon = up ? "▲" : "▼";
	return `<span class="kpi-badge ${cls}">${icon} ${Math.abs(pct)}% so với tháng trước</span>`;
}

function statusLabel(status) {
	const map = {
		confirmed: ["Đã xác nhận", "confirmed"],
		pending: ["Chờ xử lý", "pending"],
		cancelled: ["Đã huỷ", "cancelled"],
		open: ["Đang mở", "open"],
		closed: ["Đã đóng", "closed"],
		full: ["Đã đầy", "full"],
	};
	const [label, cls] = map[status] || [status, ""];
	return `<span class="status-badge status-${cls}">${label}</span>`;
}

// ─── Charts ─────────────────────────────────────
let revenueChart = null;
let statusChart = null;

function initRevenueChart(labels, data) {
	const ctx = document.getElementById("revenueChart").getContext("2d");
	if (revenueChart) revenueChart.destroy();
	revenueChart = new Chart(ctx, {
		type: "bar",
		data: {
			labels,
			datasets: [
				{
					label: "Doanh thu (VND)",
					data,
					backgroundColor: "rgba(59,130,246,0.18)",
					borderColor: "#3b82f6",
					borderWidth: 2,
					borderRadius: 8,
					borderSkipped: false,
					type: "bar",
				},
				{
					label: "Xu hướng",
					data,
					type: "line",
					borderColor: "#8b5cf6",
					borderWidth: 2.5,
					pointBackgroundColor: "#8b5cf6",
					pointRadius: 4,
					tension: 0.4,
					fill: false,
					yAxisID: "y",
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: "index", intersect: false },
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: (ctx) => (ctx.datasetIndex === 0 ? " " + fmt(ctx.raw) : ""),
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (v) => (v >= 1e6 ? (v / 1e6).toFixed(0) + "M" : v),
						color: "#94a3b8",
						font: { size: 11 },
					},
					grid: { color: "#f1f5f9" },
				},
				x: {
					ticks: { color: "#94a3b8", font: { size: 11 } },
					grid: { display: false },
				},
			},
		},
	});
}

function initStatusChart(data) {
	const colorMap = { confirmed: "#10b981", pending: "#f59e0b", cancelled: "#ef4444" };
	const labelMap = { confirmed: "Đã xác nhận", pending: "Chờ xử lý", cancelled: "Đã huỷ" };

	const labels = data.map((d) => labelMap[d.status] || d.status);
	const values = data.map((d) => d.count);
	const colors = data.map((d) => colorMap[d.status] || "#94a3b8");

	const ctx = document.getElementById("bookingStatusChart").getContext("2d");
	if (statusChart) statusChart.destroy();
	statusChart = new Chart(ctx, {
		type: "doughnut",
		data: {
			labels,
			datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: "72%",
			plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${fmtNum(c.raw)} booking` } } },
		},
	});

	const legend = $("booking-status-legend");
	legend.innerHTML = data
		.map(
			(d, i) => `
		<div class="legend-item">
			<span class="legend-dot" style="background:${colors[i]}"></span>
			${labels[i]}: <strong>${fmtNum(d.count)}</strong>
		</div>`
		)
		.join("");
}

// ─── Section loaders ────────────────────────────

async function loadOverview() {
	const res = await fetch(`${API}/api/stats/overview`);
	const { data } = await res.json();

	$("kpi-revenue").textContent = fmt(data.revenue_this_month);
	$("kpi-revenue-growth").innerHTML = growthBadge(data.revenue_growth);

	$("kpi-bookings").textContent = fmtNum(data.bookings_this_month);
	$("kpi-bookings-growth").innerHTML = growthBadge(data.bookings_growth);

	$("kpi-users").textContent = fmtNum(data.new_users_this_month);
	$("kpi-total-users").innerHTML = `<span class="kpi-badge kpi-badge-neutral">Tổng: ${fmtNum(data.total_users)} users</span>`;

	$("kpi-pending").textContent = fmtNum(data.pending_bookings);
	$("kpi-departures").innerHTML = `<span class="kpi-badge kpi-badge-neutral">${fmtNum(data.open_departures)} chuyến đang mở</span>`;
}

let currentYear = new Date().getFullYear();
async function loadRevenue(year) {
	$("year-display").textContent = year;
	const res = await fetch(`${API}/api/stats/revenue?year=${year}`);
	const { data } = await res.json();
	const labels = data.data.map((d) => `Th${d.month}`);
	const values = data.data.map((d) => d.revenue);
	initRevenueChart(labels, values);
}

async function loadBookingStatus() {
	const res = await fetch(`${API}/api/stats/bookings/status`);
	const { data } = await res.json();
	initStatusChart(data);
}

async function loadTopTours() {
	const res = await fetch(`${API}/api/stats/tours/top?limit=10`);
	const { data } = await res.json();
	const body = $("top-tours-body");
	body.innerHTML = data
		.map(
			(t, i) => `
		<tr>
			<td><span class="tour-rank ${i < 3 ? `rank-${i + 1}` : "rank-other"}">${i + 1}</span></td>
			<td style="font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.name}</td>
			<td><span class="region-badge">${t.region}</span></td>
			<td><strong>${fmtNum(t.total_bookings)}</strong> booking</td>
			<td style="color:#1d4ed8;font-weight:600">${fmt(t.total_revenue)}</td>
			<td>
				<div class="star-rating">
					<i class="fa-solid fa-star" style="font-size:0.75rem"></i>
					${t.avg_rating} <small style="color:#94a3b8;font-weight:400">(${t.review_count})</small>
				</div>
			</td>
		</tr>`
		)
		.join("");
	if (!data.length)
		body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có dữ liệu</td></tr>';
}

async function loadReviews() {
	const res = await fetch(`${API}/api/stats/reviews`);
	const { data } = await res.json();
	const { overall, top_rated_tours, most_wishlisted } = data;

	// avg badge
	$("avg-rating-badge").textContent = overall.avg_rating || "0";
	$("total-reviews-label").textContent = `Tổng ${fmtNum(overall.total_reviews)} đánh giá`;

	// rating bars
	const total = overall.total_reviews || 1;
	const bars = [5, 4, 3, 2, 1]
		.map((star) => {
			const count = overall[`star${star}`] || 0;
			const pct = ((count / total) * 100).toFixed(1);
			return `
			<div class="rating-bar-row">
				<span class="rating-bar-label">${star}<i class="fa-solid fa-star"></i></span>
				<div class="rating-bar-track">
					<div class="rating-bar-fill" data-pct="${pct}" style="width:0%"></div>
				</div>
				<span class="rating-bar-count">${count}</span>
			</div>`;
		})
		.join("");
	$("rating-bars").innerHTML = bars;

	// animate bars
	setTimeout(() => {
		document.querySelectorAll(".rating-bar-fill").forEach((el) => {
			el.style.width = el.dataset.pct + "%";
		});
	}, 100);

	// top rated list
	const topList = top_rated_tours
		.slice(0, 5)
		.map(
			(t, i) => `
		<div class="top-item">
			<div class="top-item-rank">${i + 1}</div>
			<div class="top-item-body">
				<div class="top-item-name">${t.name}</div>
				<div class="top-item-meta">${t.region} · ${t.review_count} đánh giá</div>
			</div>
			<div class="top-item-value">
				<span style="color:#f59e0b">★</span> ${t.avg_rating}
			</div>
		</div>`
		)
		.join("");
	$("top-rated-list").innerHTML = topList || '<p class="text-muted text-center">Chưa có đánh giá</p>';
}

async function loadOccupancy() {
	const res = await fetch(`${API}/api/stats/tours/occupancy`);
	const { data } = await res.json();
	const body = $("occupancy-body");
	body.innerHTML = data
		.map((d) => {
			const pct = parseFloat(d.occupancy_rate) || 0;
			const barCls = pct >= 100 ? "full" : pct >= 80 ? "high" : "";
			const dateStr = new Date(d.departure_date).toLocaleDateString("vi-VN");
			return `
			<tr>
				<td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.tour_name}</td>
				<td>${dateStr}</td>
				<td>${d.departure_location}</td>
				<td>${fmtNum(d.seats_booked)} / ${fmtNum(d.seats_total)}</td>
				<td>
					<div class="occupancy-bar-wrap">
						<div class="occupancy-bar-track">
							<div class="occupancy-bar-fill ${barCls}" style="width:${Math.min(pct, 100)}%"></div>
						</div>
						<span style="font-size:0.8rem;font-weight:700;color:#475569">${pct}%</span>
					</div>
				</td>
				<td>${statusLabel(d.status)}</td>
			</tr>`;
		})
		.join("");
	if (!data.length)
		body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Không có chuyến nào sắp tới</td></tr>';
}

async function loadTopCustomers() {
	const res = await fetch(`${API}/api/stats/users`);
	const { data } = await res.json();
	const list = $("top-customers-list");
	list.innerHTML = data.top_customers
		.map(
			(c, i) => `
		<div class="top-item">
			<div class="top-item-rank">${i + 1}</div>
			<div class="top-item-body">
				<div class="top-item-name">${c.fullname}</div>
				<div class="top-item-meta">${c.email} · ${c.booking_count} lần đặt tour</div>
			</div>
			<div class="top-item-value">
				${fmt(c.total_spent)}
				<small>Chi tiêu</small>
			</div>
		</div>`
		)
		.join("");
	if (!data.top_customers.length)
		list.innerHTML = '<p class="text-muted text-center py-3">Chưa có dữ liệu</p>';
}

// Boot - Chuyển thành function để admin-dashboard.js gọi
window.initAdminStatisticsPage = async function() {
	try {
		currentYear = new Date().getFullYear(); // Reset year
		await Promise.all([
			loadOverview(), 
			loadRevenue(currentYear), 
			loadBookingStatus(), 
			loadTopTours(), 
			loadReviews(), 
			loadOccupancy(), 
			loadTopCustomers()
		]);

		// Gán lại sự kiện cho các nút điều hướng năm (cần thiết vì content bị load động)
		const prevBtn = document.getElementById("prev-year");
		const nextBtn = document.getElementById("next-year");
		
		if (prevBtn) {
			prevBtn.onclick = () => {
				currentYear--;
				loadRevenue(currentYear);
			};
		}
		if (nextBtn) {
			nextBtn.onclick = () => {
				currentYear++;
				loadRevenue(currentYear);
			};
		}

	} catch (err) {
		console.error("Statistics init error:", err);
	}
};
