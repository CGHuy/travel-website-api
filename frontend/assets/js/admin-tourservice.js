document.addEventListener('DOMContentLoaded', function () {

    if (typeof bootstrap === 'undefined') {
        alert('Bootstrap chưa được load!');
        return;
    }

    const serviceModalEl = document.getElementById('serviceModal');

    if (serviceModalEl) {
        const serviceModal = new bootstrap.Modal(serviceModalEl);
        const serviceModalLabel = document.getElementById('serviceModalLabel');
        const tourIdInput = document.getElementById('form-tour-id');
        const serviceSearchInput = document.getElementById('service-search-input');

        if (serviceModalLabel && tourIdInput) {
            serviceModalEl.addEventListener('show.bs.modal', function (event) {
                const button = event.relatedTarget;
                if (!button) return;

                const tourId = button.getAttribute('data-tour-id') || '';
                const tourName = button.getAttribute('data-tour-name') || '';
                const actionName = button.getAttribute('data-action-name') || 'Quản lý';

                tourIdInput.value = tourId;
                serviceModalLabel.textContent = `${actionName} Dịch vụ cho Tour: ${tourName}`;

                if (serviceSearchInput) {
                    serviceSearchInput.value = '';
                }

                const serviceItems = serviceModalEl.querySelectorAll('.service-item');
                serviceItems.forEach(item => {
                    item.style.display = '';
                });
            });
        }
    }

    // Search functionality for tour list
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            const filter = searchInput.value.toLowerCase();
            const list = document.querySelector('#tour-service-list');
            const items = list.getElementsByClassName('list-group-item');

            for (let i = 0; i < items.length; i++) {
                const text = items[i].textContent || items[i].innerText;
                items[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
            }
        });
    }

    // Search functionality for services in modal
    function initializeServiceSearch() {
        const serviceSearchInput = document.getElementById('service-search-input');
        if (serviceSearchInput) {
            serviceSearchInput.addEventListener('keyup', function () {
                const filter = serviceSearchInput.value.toLowerCase();
                const serviceItems = document.querySelectorAll('.service-item');

                serviceItems.forEach(function (item) {
                    const serviceId = item.getAttribute('data-service-id');
                    const serviceName = item.getAttribute('data-service-name');

                    // Tìm kiếm theo ID hoặc tên
                    if (serviceId.toLowerCase().includes(filter) || serviceName.includes(filter)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    }

    initializeServiceSearch();
});
