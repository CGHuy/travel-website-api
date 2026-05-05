const Tour = require("../models/Tour");
const Departure = require("../models/Departure");
const { deleteFromCloudinaryByUrl } = require("../middlewares/mediaStorage");

exports.getAllTours = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);
        const keyword = (req.query.keyword || req.query.q || "").toString().trim();

        const result = await Tour.getAllPaginated({
            page,
            limit,
            keyword,
        });

        const data = (Array.isArray(result.data) ? result.data : []).map((tour) => ({
            ...tour,
            code: `TOUR${String(tour.id).padStart(3, "0")}`,
        }));

        res.json({
            success: true,
            data,
            pagination: result.pagination,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Lấy tours theo region
exports.getToursByRegion = async (req, res) => {
    try {
        const region = (req.params.region || "").toString().trim();

        if (!region) {
            return res.status(400).json({
                success: false,
                message: "Vùng miền không hợp lệ",
            });
        }

        const tours = await Tour.getByRegion(region);
        const data = tours.map((tour) => ({
            ...tour,
            code: `TOUR${String(tour.id).padStart(3, "0")}`,
        }));

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Lấy tour theo ID
exports.getTourById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID tour không hợp lệ",
            });
        }

        const tour = await Tour.getById(id);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        const data = {
            ...tour,
            code: `TOUR${String(tour.id).padStart(3, "0")}`,
        };

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Tạo tour mới
exports.createTour = async (req, res) => {
    try {
        const { name, slug, description, price_default, price_child, region, duration, location } = req.body;

        // Lấy URL ảnh từ Cloudinary nếu có file được upload
        const imageUrl = req.file ? req.file.path : null;

        const tourId = await Tour.create({
            name,
            slug,
            description,
            price_default: Number(price_default),
            price_child: Number(price_child),
            region,
            duration,
            location,
            image: imageUrl,
        });

        const createdTour = await Tour.getById(tourId);
        const data = {
            ...createdTour,
            code: `TOUR${String(createdTour.id).padStart(3, "0")}`,
        };

        res.status(201).json({
            success: true,
            message: "Tạo tour thành công",
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Cập nhật tour
exports.updateTour = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID tour không hợp lệ",
            });
        }

        const { name, slug, description, price_default, price_child, region, duration, location } = req.body;
        const existingTour = await Tour.getById(id);

        if (!existingTour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        const oldImageUrl = existingTour.cover_image || existingTour.image || null;

        // Giữ ảnh cũ nếu không upload ảnh mới
        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        } else if (req.body.image || req.body.cover_image || req.body.existing_image) {
            imageUrl = req.body.image || req.body.cover_image || req.body.existing_image;
        } else {
            imageUrl = oldImageUrl;
        }

        const updated = await Tour.update(id, {
            name,
            slug,
            description,
            price_default: Number(price_default),
            price_child: Number(price_child),
            region,
            duration,
            location,
            image: imageUrl,
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        if (req.file && oldImageUrl && oldImageUrl !== req.file.path) {
            try {
                await deleteFromCloudinaryByUrl(oldImageUrl);
            } catch (cloudinaryError) {
                console.error("Không thể xóa ảnh cũ trên Cloudinary:", cloudinaryError.message || cloudinaryError);
            }
        }

        const updatedTour = await Tour.getById(id);
        const data = {
            ...updatedTour,
            code: `TOUR${String(updatedTour.id).padStart(3, "0")}`,
        };

        res.json({
            success: true,
            message: "Cập nhật tour thành công",
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Xóa tour
exports.deleteTour = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID tour không hợp lệ",
            });
        }

        const existingTour = await Tour.getById(id);
        if (!existingTour) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        // Kiểm tra xem tour có điểm khởi hành chưa
        const departures = await Departure.getByTourId(id);
        if (departures && departures.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa tour vì tour này đã có điểm khởi hành",
            });
        }

        const oldImageUrl = existingTour.cover_image || existingTour.image || null;

        const deleted = await Tour.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tour",
            });
        }

        if (oldImageUrl) {
            try {
                await deleteFromCloudinaryByUrl(oldImageUrl);
            } catch (cloudinaryError) {
                console.error("Không thể xóa ảnh tour trên Cloudinary:", cloudinaryError.message || cloudinaryError);
            }
        }

        res.json({
            success: true,
            message: "Xóa tour thành công",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
