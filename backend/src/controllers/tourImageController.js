const Tour = require("../models/Tour");
const TourImage = require("../models/TourImage");
const { deleteFromCloudinaryByUrl } = require("../middlewares/mediaStorage");

exports.getToursForImageManagement = async (req, res) => {
    try {
        const q = String(req.query.q || "")
            .trim()
            .toLowerCase();
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);

        const result = await TourImage.getTourImageManagementList(q, page, limit);
        const rows = Array.isArray(result.data) ? result.data : [];
        const data = rows.map((tour) => ({
            id: tour.id,
            code: tour.code || `TOUR${String(tour.id).padStart(3, "0")}`,
            name: tour.name || "",
            region: tour.region || "",
            cover_image: tour.cover_image || "",
            image_count: Number(tour.image_count || 0),
        }));

        return res.json({
            success: true,
            data,
            pagination: result.pagination,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getImagesByTourId = async (req, res) => {
    try {
        const tourId = parseInt(req.params.tourId, 10);

        if (isNaN(tourId)) {
            return res.status(400).json({
                success: false,
                message: "ID tour không hợp lệ",
            });
        }

        const tour = await Tour.getById(tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        const images = await TourImage.getByTourId(tourId);

        return res.json({
            success: true,
            data: {
                tour: {
                    id: tour.id,
                    name: tour.name,
                    code: `TOUR${String(tour.id).padStart(3, "0")}`,
                },
                images,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.createTourImage = async (req, res) => {
    try {
        const tourId = parseInt(req.params.tourId, 10);

        if (isNaN(tourId)) {
            return res.status(400).json({
                success: false,
                message: "ID tour không hợp lệ",
            });
        }

        const tour = await Tour.getById(tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        if (!req.file || !req.file.path) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn ảnh để tải lên",
            });
        }

        const imageId = await TourImage.create({
            tour_id: tourId,
            image: req.file.path,
        });

        const image = await TourImage.getById(imageId);

        return res.status(201).json({
            success: true,
            message: "Thêm ảnh tour thành công",
            data: image,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteTourImage = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID ảnh không hợp lệ",
            });
        }

        const existing = await TourImage.getById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy ảnh tour",
            });
        }

        const deleted = await TourImage.delete(id);
        if (!deleted) {
            return res.status(500).json({
                success: false,
                message: "Xóa ảnh tour thất bại",
            });
        }

        try {
            await deleteFromCloudinaryByUrl(existing.image);
        } catch (error) {
            // Không chặn luồng chính nếu xóa trên Cloudinary thất bại.
            console.error("Không thể xóa ảnh trên Cloudinary:", error.message || error);
        }

        return res.json({
            success: true,
            message: "Xóa ảnh tour thành công",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
