// Validation cho tao/cap nhat tour
exports.validateTour = (req, res, next) => {
    const { name, slug, description, location, region, duration, price_default, price_child, cover_image } = req.body;
    const errors = [];
    const isCreate = req.method === "POST";

    if (!name || name.trim().length === 0) {
        errors.push("Tên tour không được để trống");
    } else if (name.length > 200) {
        errors.push("Tên tour không được vượt quá 200 ký tự");
    }

    if (isCreate && (!slug || slug.trim().length === 0)) {
        errors.push("Slug không được để trống");
    } else if (slug && slug.length > 200) {
        errors.push("Slug không được vượt quá 200 ký tự");
    }

    if (!description || description.trim().length === 0) {
        errors.push("Mô tả không được để trống");
    } else if (description.length > 2000) {
        errors.push("Mô tả không được vượt quá 2000 ký tự");
    }

    if (!price_default || isNaN(price_default) || price_default <= 0) {
        errors.push("Giá tour mặc định phải là số dương");
    } else if (price_default > 999999999) {
        errors.push("Giá tour mặc định không được vượt quá 999,999,999");
    }

    if (!price_child || isNaN(price_child) || price_child < 0) {
        errors.push("Giá trẻ em phải là số không âm");
    } else if (price_child > 999999999) {
        errors.push("Giá trẻ em không được vượt quá 999,999,999");
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
