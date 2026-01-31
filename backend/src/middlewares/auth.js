const jwt = require('jsonwebtoken');

// Middleware kiểm tra token
const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token. Vui lòng đăng nhập!'
      });
    }

    // Token format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập!'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập. Chỉ admin mới được phép!'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền admin'
    });
  }
};

// Middleware kiểm tra quyền user (đã đăng nhập)
const isUser = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục!'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra đăng nhập'
    });
  }
};

// Middleware kiểm tra quyền sở hữu (user chỉ được thao tác với data của mình)
const isOwner = (paramName = 'userId') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.params[paramName] || req.body[paramName];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin user ID'
        });
      }

      // Admin có thể truy cập mọi resource
      if (req.user.role === 'admin') {
        return next();
      }

      // User chỉ được truy cập resource của chính họ
      if (req.user.id !== parseInt(resourceUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này!'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền sở hữu'
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