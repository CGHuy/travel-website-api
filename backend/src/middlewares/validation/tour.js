// Validation cho tao/cap nhat tour
const validateTour = (req, res, next) => {
    const { name, description, price, region, duration, location } = req.body;
    const errors = [];

    if (!name || name.trim().length === 0) {
        errors.push("Tên tour không được để trống");
    } else if (name.length > 200) {
        errors.push("Tên tour không được vượt quá 200 ký tự");
    }

    if (!description || description.trim().length === 0) {
        errors.push("Mô tả không được để trống");
    } else if (description.length > 2000) {
        errors.push("Mô tả không được vượt quá 2000 ký tự");
    }

    if (!price || isNaN(price) || price <= 0) {
        errors.push("Giá tour phải là số dương");
    } else if (price > 999999999) {
        errors.push("Giá tour không được vượt quá 999,999,999");
    }

    if (!region || region.trim().length === 0) {
        errors.push("Vùng miền không được để trống");
    } else if (region.length > 100) {
        errors.push("Vùng miền không được vượt quá 100 ký tự");
    }

    if (!duration || duration.trim().length === 0) {
        errors.push("Thời gian không được để trống");
    } else if (duration.length > 100) {
        errors.push("Thời gian không được vượt quá 100 ký tự");
    }

    if (!location || location.trim().length === 0) {
        errors.push("Địa điểm không được để trống");
    } else if (location.length > 255) {
        errors.push("Địa điểm không được vượt quá 255 ký tự");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Dữ liệu không hợp lệ",
            errors,
        });
    }

    next();
};

module.exports = {
    validateTour,
};
