document.addEventListener('DOMContentLoaded', function () {
    // Lấy modal lịch trình
    const itineraryModalEl = document.getElementById('itineraryModal');
    if (!itineraryModalEl) return;

    const itineraryModalLabel = document.getElementById('itineraryModalLabel');
    const modalBody = itineraryModalEl.querySelector('.modal-body');

    // Tải form khi modal được mở
    itineraryModalEl.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget; // Nút đã bấm để mở modal
        if (!button) return;

        // Lấy dữ liệu từ nút
        const tourId = button.getAttribute('data-tour-id');
        const tourName = button.getAttribute('data-tour-name');
        const actionName = button.getAttribute('data-action-name');
        const formUrl = button.getAttribute('data-form-url') || `index.php?controller=TourItinerary&action=getForm&tour_id=${tourId}`;

        // Cập nhật tiêu đề modal
        itineraryModalLabel.textContent = `${actionName} Lịch Trình cho Tour: ${tourName}`;
        
        // Hiển thị loading
        modalBody.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Đang tải...</p></div>';

        // Gọi API để lấy form
        fetch(formUrl)
            .then(response => response.ok ? response.text() : Promise.reject(`HTTP error! status: ${response.status}`))
            .then(html => {
                modalBody.innerHTML = html;
                initializeItineraryForm(); // Khởi tạo các chức năng form
            })
            .catch(error => {
                modalBody.innerHTML = `<div class="alert alert-danger"><strong>Lỗi!</strong> Không thể tải form: ${error}</div>`;
            });
    });

    // Xóa nội dung modal khi đóng
    itineraryModalEl.addEventListener('hidden.bs.modal', () => modalBody.innerHTML = '');

    // Khởi tạo các chức năng form lịch trình
    function initializeItineraryForm() {
        const daysContainer = document.getElementById('itinerary-days-container');
        const addDayBtn = document.getElementById('add-day-btn');
        const itineraryForm = document.getElementById('itinerary-form');
        const dayTemplate = document.getElementById('itinerary-day-template');
        if (!daysContainer || !dayTemplate) return;

        // Cập nhật số thứ tự ngày và tên input
        function updateDayInputs() {
            daysContainer.querySelectorAll('.itinerary-day-item').forEach((item, index) => {
                const dayNumber = index + 1;
                
                // Cập nhật tiêu đề ngày
                const dayTitle = item.querySelector('.day-title');
                if (dayTitle) dayTitle.innerHTML = `<i class="fas fa-calendar-day text-primary me-2"></i>Ngày ${dayNumber}`;
                
                // Cập nhật input số ngày
                const dayNumberInput = item.querySelector('.day-number-input');
                if (dayNumberInput) {
                    dayNumberInput.name = `days[${index}][day_number]`;
                    dayNumberInput.value = dayNumber;
                }
                
                // Cập nhật textarea mô tả
                const descriptionTextarea = item.querySelector('.day-description-textarea');
                if (descriptionTextarea) descriptionTextarea.name = `days[${index}][description]`;
            });
        }

        // Thêm ngày mới
        function addDay() {
            daysContainer.appendChild(dayTemplate.content.cloneNode(true));
            updateDayInputs();
        }

        // Xử lý nút xóa ngày
        daysContainer.addEventListener('click', function(e) {
            if (e.target.closest('.remove-day-btn')) {
                const dayItems = daysContainer.querySelectorAll('.itinerary-day-item');
                if (dayItems.length > 1) {
                    e.target.closest('.itinerary-day-item').remove();
                    updateDayInputs();
                } else {
                    alert('Phải có ít nhất một ngày trong lịch trình!');
                }
            }
        });

        // Gắn sự kiện cho nút thêm ngày
        if (addDayBtn) addDayBtn.addEventListener('click', addDay);
        
        // Cập nhật input trước khi submit form
        if (itineraryForm) itineraryForm.addEventListener('submit', updateDayInputs);

        // Khởi tạo ban đầu
        updateDayInputs();
        if (daysContainer.children.length === 0) addDay(); // Thêm ngày đầu tiên nếu chưa có
    }

    // Chức năng tìm kiếm
    var searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            var filter = searchInput.value.toLowerCase();
            var list = document.querySelector('.list-group');
            var items = list.getElementsByClassName('list-group-item');

            for (var i = 0; i < items.length; i++) {
                var nameElement = items[i].querySelector('.find_name');
                var idElement = items[i].querySelector('.find_id');

                var nameText = nameElement ? nameElement.textContent || nameElement.innerText : '';
                var idText = idElement ? idElement.textContent || idElement.innerText : '';

                if (nameText.toLowerCase().indexOf(filter) > -1 ||
                    idText.toLowerCase().indexOf(filter) > -1) {
                    items[i].classList.remove('d-none');
                } else {
                    items[i].classList.add('d-none');
                }
            }
        });
    }
});