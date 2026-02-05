const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET chưa được cấu hình trong biến môi trường');
}

// Middleware kiểm tra token
const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token. Vui lòng đăng nhập!'
      });
    }

    // Token format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Định dạng token không hợp lệ. Sử dụng: Bearer <token>'
      });
    }

    const token = parts[1];
    if (!token || token.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token không được để trống'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lưu thông tin user vào request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại!'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Quyền truy cập bị từ chối. Chỉ admin mới được phép!'
      });
    }

    next();
  } catch (error) {
    console.error('Lỗi trong isAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi kiểm tra quyền admin'
    });
  }
};

// Middleware kiểm tra quyền user (đã đăng nhập)
const isUser = (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục!'
      });
    }

    next();
  } catch (error) {
    console.error('Lỗi trong isUser middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi kiểm tra đăng nhập'
    });
  }
};

// Middleware kiểm tra quyền sở hữu (user chỉ được thao tác với data của mình)
const isOwner = (paramName = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập lại để tiếp tục'
        });
      }

      const resourceUserId = req.params[paramName] || req.body[paramName];
      
      if (!resourceUserId || (typeof resourceUserId === 'string' && resourceUserId.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          message: `Thiếu thông tin bắt buộc: ${paramName}`
        });
      }

      // Admin có thể truy cập mọi resource
      if (req.user.role === 'admin') {
        return next();
      }

      // User chỉ được truy cập resource của chính họ
      const resourceUserIdInt = parseInt(resourceUserId);
      if (isNaN(resourceUserIdInt) || req.user.id !== resourceUserIdInt) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này!'
        });
      }

      next();
    } catch (error) {
      console.error('Lỗi trong isOwner middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ nội bộ khi kiểm tra quyền sở hữu'
      });
    }
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isUser,
  isOwner
};