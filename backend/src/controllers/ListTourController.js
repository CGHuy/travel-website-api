const Tour = require("../models/Tour");

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
    
