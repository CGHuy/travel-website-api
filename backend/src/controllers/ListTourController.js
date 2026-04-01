const ListTourService = require("../services/ListTourService");
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
            service_ids: req.query.services ? req.query.services.split(',') : []
        };

        const tours = await ListTourService.getFilteredTours(filters);

        res.json({
            success: true,
            message: "Lọc danh sách tour thành công!",
            data: tours,
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

// Render giao diện danh sách tour
exports.renderListPage = (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/pages/user/list-tour.html"));
};
