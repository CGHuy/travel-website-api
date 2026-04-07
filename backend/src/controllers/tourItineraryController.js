const TourItinerary = require("../models/TourItinerary");
const Tour = require("../models/Tour");

// Lấy tất cả itinerary của 1 tour
exports.getByTourId = async (req, res) => {
    try {
        const tourId = parseInt(req.params.tourId);

        // Kiểm tra tour có tồn tại
        const tour = await Tour.getById(tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        const itineraries = await TourItinerary.getByTourId(tourId);

        res.json({
            success: true,
            data: itineraries,
        });
    } catch (error) {
        console.error("Lỗi lấy itinerary:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy lịch trình tour",
            error: error.message,
        });
    }
};

// Cập nhật toàn bộ lịch trình của 1 tour (bulk update từ admin-itinerary.js)
exports.updateTourItineraries = async (req, res) => {
    try {
        const tourId = parseInt(req.params.tourId);
        const { days } = req.body;

        // Kiểm tra tour có tồn tại
        const tour = await Tour.getById(tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        // Xóa tất cả itinerary cũ của tour này
        await TourItinerary.deleteByTourId(tourId);

        // Tạo itinerary mới từ mảng days
        if (Array.isArray(days) && days.length > 0) {
            for (const day of days) {
                await TourItinerary.create({
                    tour_id: tourId,
                    day_number: parseInt(day.day_number),
                    description: day.description.trim(),
                });
            }
        }

        // Lấy toàn bộ itinerary vừa tạo
        const updatedItineraries = await TourItinerary.getByTourId(tourId);

        res.json({
            success: true,
            message: "Cập nhật lịch trình tour thành công",
            data: updatedItineraries,
        });
    } catch (error) {
        console.error("Lỗi cập nhật bulk itinerary:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật lịch trình tour",
            error: error.message,
        });
    }
};

exports.deleteByTourId = async (req, res) => {
    try {
        const tourId = parseInt(req.params.tourId);
        await TourItinerary.deleteByTourId(tourId);
        res.json({
            success: true,
            message: "Xóa lịch trình tour thành công",
        });
    } catch (error) {
        console.error("Lỗi xóa itinerary theo tourId:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa lịch trình tour",
            error: error.message,
        });
    }
};
