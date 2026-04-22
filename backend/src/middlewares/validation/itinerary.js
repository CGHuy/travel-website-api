// Validation cho bulk update lịch trình
exports.validateBulkItineraries = (req, res, next) => {
    const { days } = req.body;
    const errors = [];

    if (!Array.isArray(days)) {
        errors.push("days phải là một mảng");
    } else if (days.length > 10) {
        errors.push("Lịch trình không được vượt quá 10 ngày");
    } else {
        // Validate từng phần tử trong mảng
        days.forEach((day, index) => {
            if (!day.day_number || isNaN(day.day_number) || parseInt(day.day_number) < 1) {
                errors.push(`Ngày ${index + 1}: số ngày phải là số dương`);
            } else if (parseInt(day.day_number) > 10) {
                errors.push(`Ngày ${index + 1}: số ngày không được vượt quá 10`);
            }

            if (!day.description || day.description.trim().length === 0) {
                errors.push(`Ngày ${index + 1}: mô tả không được để trống`);
            } else if (day.description.length > 5000) {
                errors.push(`Ngày ${index + 1}: mô tả không được vượt quá 5000 ký tự`);
            }
        });
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
