// Validation cho đăng ký
const validateRegister = (req, res, next) => {
    const { fullname, phone, email, password, confirmPassword } = req.body;
    const errors = {};

    if (!fullname || fullname.trim().length === 0) {
        errors.fullname = "Họ và tên không được để trống";
    } else if (fullname.length < 3) {
        errors.fullname = "Họ và tên phải có ít nhất 3 ký tự";
    } else if (fullname.length > 50) {
        errors.fullname = "Họ và tên không được vượt quá 50 ký tự";
    } else {
        const fullnameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!fullnameRegex.test(fullname.trim())) {
            errors.fullname = "Họ và tên chỉ được chứa chữ cái và khoảng trắng";
        }
    }

    if (!phone || phone.trim().length === 0) {
        errors.phone = "Số điện thoại không được để trống";
    } else if (!/^0[0-9]{9}$/.test(phone.trim())) {
        errors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)";
    }

    if (!email || email.trim().length === 0) {
        errors.email = "Email không được để trống";
    } else if (email.length < 6) {
        errors.email = "Email phải có ít nhất 6 ký tự";
    } else if (email.length > 100) {
        errors.email = "Email không được vượt quá 100 ký tự";
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.email = "Email không hợp lệ";
        }
    }

    if (!password || password.trim().length === 0) {
        errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 6) {
        errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (password.length > 20) {
        errors.password = "Mật khẩu không được vượt quá 20 ký tự";
    }

    if (!confirmPassword || confirmPassword.trim().length === 0) {
        errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Dữ liệu không hợp lệ",
            errors,
        });
    }

    next();
};

// Validation cho đăng nhập
const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = {};

    if (!username || username.trim().length === 0) {
        errors.username = "Email hoặc số điện thoại không được để trống";
    }

    if (!password || password.trim().length === 0) {
        errors.password = "Mật khẩu không được để trống";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng điền đầy đủ thông tin",
            errors,
        });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
};
