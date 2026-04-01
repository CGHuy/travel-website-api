const Tour = require("../models/Tour");
const path = require("path");

exports.getAllTours = async (req, res) => {
    try {
        const tours = await Tour.getAll();
        res.json({
            success: true,
            message: "Lấy danh sách tour thành công!",
            data: tours,
        });
    } catch (error) {
        console.error("Get all tours error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi không hiển thị được Tour",
            error: error.message })
    }
};

// Render giao diện danh sách tour
exports.renderListPage = (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/pages/user/list-tour.html"));
};
