const ListTourService = require("../services/listTourService");
const path = require("path");

exports.getAllTours = async (req, res) => {
    try {
        // Lấy tất cả params gửi lên từ JS (req.query) cấu trúc lại
        const filters = {
            search: req.query.search || '',
            max_price: req.query.max_price || null,
            region: req.query.region || '',
            duration_type: req.query.duration || '',
            sort: req.query.sort || '',
            service_ids: req.query.services ? req.query.services.split(',').map(id => id.trim()).filter(id => id !== '') : [],
            page: req.query.page || 1,
            limit: req.query.limit || 6
        };

        const result = await ListTourService.getFilteredTours(filters);

        res.json({
            success: true,
            message: "Lấy danh sách tour thành công!",
            data: result.tours,
            pagination: {
                totalCount: result.totalCount,
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                limit: filters.limit
            }
        });
    } catch (error) {
        console.error("Lỗi getFilteredTours:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không lấy được danh sách Tour",
            error: error.message 
        });
    }
};

// Lấy danh sách dịch vụ để hiển thị bộ lọc
exports.getServices = async (req, res) => {
    try {
        const services = await ListTourService.getAllServices();
        res.json({
            success: true,
            data: services,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi không lấy được danh sách dịch vụ",
            error: error.message
        });
    }
};

exports.getDetailTour = async (req, res) => {
    const tourId = req.params.id;
    try {
        const tourDetail = await ListTourService.getDetailTour(tourId);
        if (!tourDetail) {
            return res.status(404).json({
                success: false,
                message: "Tour không tồn tại"
            });
        }
        res.json({
            success: true,
            data: tourDetail
        });
    } catch (error) {
        console.error("Lỗi getDetailTour:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không lấy được chi tiết Tour",
            error: error.message
        });
    }
};

exports.getTourandDepartures = async (req, res) => {
    const tourId = req.params.id;
    try {
        const result = await ListTourService.getTourAndDepartures(tourId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error("Lỗi getTourAndDepartures:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không lấy được thông tin tour và ngày khởi hành",
            error: error.message
        });
    }
};

// Render giao diện danh sách tour
exports.renderListPage = (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/pages/user/list-tour.html"));
};
