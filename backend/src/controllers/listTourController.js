const ListTourService = require("../services/listTourService");
const WishList = require("../models/Wishlist");
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

exports.addWishList = async (req, res) => {
    const tourId = req.params.id;
    const userId = req.user.id; // Lấy userId từ token đã xác thực
    try {
        const checkWishList = await WishList.exists(userId, tourId);
        if (checkWishList) {
            return res.status(400).json({
                success: false,
                message: "Tour đã có trong wishlist"
            });
        }
        await WishList.add(userId, tourId);
        res.json({
            success: true,
            message: "Thêm tour vào wishlist thành công"
        });
    } catch (error) {
        console.error("Lỗi addWishList:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không thêm được tour vào wishlist",
            error: error.message
        });
    }
}

exports.checkWishList = async (req, res) => {
    const tourId = req.params.id;
    const userId = req.user.id;
    try {
        const checkWishList = await WishList.exists(userId, tourId);
        res.json({
            success: true,
            inWishlist: checkWishList
        });
    }
    catch (error) {
        console.error("Lỗi checkWishList:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không kiểm tra được wishlist",
            error: error.message
        });
    }
}

exports.removeWishList = async (req, res) => {
    const tourId = req.params.id;
    const userId = req.user.id;
    try {
        const removed = await WishList.remove(userId, tourId);
        if (!removed) {
            return res.status(400).json({
                success: false,
                message: "Tour không có trong wishlist"
            });
        }
        res.json({
            success: true,
            message: "Xóa tour khỏi wishlist thành công"
        });
    }
    catch (error) {
        console.error("Lỗi removeWishList:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không xóa được tour khỏi wishlist",
            error: error.message
        });
    }
};

exports.getWishListByUser = async (req, res) => {
    const userId = req.user.id;
    try {
        const wishlist = await WishList.getByUserId(userId);
        res.status(200).json({
            success: true,
            data: wishlist
        });
    } catch (error) {
        console.error("Lỗi getWishListByUser:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không lấy được danh sách wishlist của người dùng",
            error: error.message
        });
    }
};

exports.demo = async (req, res) => {};



// Render giao diện danh sách tour
exports.renderListPage = (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/pages/user/list-tour.html"));
};
