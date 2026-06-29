const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Tạo JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }, // Token hết hạn sau 7 ngày
    );
};

// Đăng ký user mới
exports.register = async (req, res) => {
    try {
        const { fullname, phone, email, password } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email đã được sử dụng!",
            });
        }

        // Kiểm tra phone đã tồn tại chưa
        const existingPhone = await User.findByPhone(phone);
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "Số điện thoại đã được sử dụng!",
            });
        }

        // Tạo user mới
        const userId = await User.create({
            fullname,
            phone,
            email,
            password,
            role: "customer", // Mặc định là customer
        });

        // Lấy thông tin user vừa tạo
        const newUser = await User.findById(userId);

        // Tạo token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công! Đang chuyển hướng...",
            data: {
                user: {
                    id: newUser.id,
                    fullname: newUser.fullname,
                    phone: newUser.phone,
                    email: newUser.email,
                    role: newUser.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đăng ký",
            error: error.message,
        });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm user theo email hoặc số điện thoại
        const user = await User.findByEmailOrPhone(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc số điện thoại không đúng!",
            });
        }

        // Kiểm tra xem user có bị khóa không
        if (user.status === 0) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
            });
        }

        // Kiểm tra password
        const isPasswordValid = await User.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Mật khẩu không đúng!",
            });
        }

        // Tạo token
        const token = generateToken(user);

        res.json({
            success: true,
            message: "Đăng nhập thành công! Đang chuyển hướng...",
            data: {
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đăng nhập",
            error: error.message,
        });
    }
};

// Verify token (kiểm tra token còn hợp lệ không)
exports.verifyToken = (req, res) => {
    // Nếu đến đây nghĩa là token hợp lệ (đã qua verifyToken middleware)
    res.json({
        success: true,
        message: "Token hợp lệ",
        data: {
            user: req.user,
        },
    });
};
