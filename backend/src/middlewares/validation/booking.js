// Validation cho tao booking
const validateBooking = (req, res, next) => {
    const { tour_id, booking_date, number_of_people } = req.body;
    const errors = [];

    if (!tour_id || isNaN(tour_id)) {
        errors.push("ID tour không hợp lệ");
    }

    if (!booking_date) {
        errors.push("Ngày đặt tour không được để trống");
    } else {
        const bookingDate = new Date(booking_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (bookingDate < today) {
            errors.push("Ngày đặt tour phải từ hôm nay trở đi");
        }
    }

    if (!number_of_people || isNaN(number_of_people) || number_of_people <= 0) {
        errors.push("Số người phải là số dương");
    } else if (number_of_people > 50) {
        errors.push("Số người không được vượt quá 50");
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

const validateBookingTour = (req, res, next) => {
    const { departure_id, adults, children,
            contact_name, contact_phone, contact_email,
            contact_dob, passengers } = req.body;
    const errors = [];

    // Kiểm tra thông tin cơ bản
    if (!departure_id || isNaN(departure_id))
        errors.push("departure_id không hợp lệ");
    if (!adults || isNaN(adults) || parseInt(adults) < 1)
        errors.push("Số người lớn phải ít nhất là 1");
    if (children === undefined || isNaN(children) || parseInt(children) < 0)
        errors.push("Số trẻ em không hợp lệ");
    if (!contact_name?.trim())
        errors.push("Tên người liên hệ không được trống");
    if (!contact_phone?.trim())
        errors.push("Số điện thoại không được trống");
    if (!contact_email?.trim())
        errors.push("Email không được trống");
    if (contact_email && !contact_email.includes("@"))
        errors.push("Email không hợp lệ");

    // Kiểm tra ngày sinh người liên hệ (bắt buộc)
    if (!contact_dob)
        errors.push("Ngày sinh người liên hệ không được để trống");

    // Kiểm tra ngày sinh của từng hành khách phụ
    if (passengers && Array.isArray(passengers)) {
        passengers.forEach((p, i) => {
            if (!p.dob)
                errors.push(`Hành khách thứ ${i + 2}: Ngày sinh không được để trống`);
            if (!p.name?.trim())
                errors.push(`Hành khách thứ ${i + 2}: Họ tên không được để trống`);
            if (!p.type || !["adult", "child"].includes(p.type))
                errors.push(`Hành khách thứ ${i + 2}: Loại hành khách không hợp lệ (adult/child)`);
        });
    }

    //Kiểm tra người đặt tour có đủ 18 tuổi hay chưa
        if (contact_dob) {
            const contactBirthDate = new Date(contact_dob);
            const today = new Date();
            const age = today.getFullYear() - contactBirthDate.getFullYear();
            if (age < 18) {
                errors.push("Người đặt tour phải đủ 18 tuổi trở lên");
            }
        }
    
    //Kiểm tra các khách hàng trẻ em có dưới 6 tuổi hay không
    if (passengers && Array.isArray(passengers)) {
        passengers.forEach((p, i) => {
            if (p.type === "child" && p.dob) {
                const childBirthDate = new Date(p.dob);
                const today = new Date();
                const age = today.getFullYear() - childBirthDate.getFullYear();
                if (age >= 6) {
                    errors.push(`Hành khách thứ ${i + 2} phải đặt ở người lớn`);
                }
            }

            if (p.type === "adult" && p.dob) {
                const adultBirthDate = new Date(p.dob);
                const today = new Date();
                const age = today.getFullYear() - adultBirthDate.getFullYear();
                if (age < 6) {
                    errors.push(`Hành khách thứ ${i + 2} phải đặt ở trẻ em`);
                }
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    next();
};

module.exports = {
    validateBooking,
    validateBookingTour
};
