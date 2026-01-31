const API_URL = 'http://localhost:3000/api';

// Lấy danh sách tours
async function getTours() {
  try {
    const response = await fetch(`${API_URL}/tours`);
    const data = await response.json();
    
    if (data.success) {
      displayTours(data.data);
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

function displayTours(tours) {
  const container = document.getElementById('tours-container');
  container.innerHTML = tours.map(tour => `
    <div class="tour-card">
      <h3>${tour.name}</h3>
      <p>${tour.description}</p>
      <p>Giá: ${tour.price} VNĐ</p>
    </div>
  `).join('');
}

// Gọi khi trang load
document.addEventListener('DOMContentLoaded', getTours);