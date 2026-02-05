// Middleware xử lý lỗi chung
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Lỗi validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn'
    });
  }

  // Lỗi MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại trong hệ thống'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tham chiếu không tồn tại'
    });
  }

  // Kiểm tra xem response đã được gửi hay chưa
  if (res.headersSent) {
    return next(err);
  }

  // Lỗi mặc định
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Lỗi server nội bộ';
  
  const response = {
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err.toString()
    })
  };

  return res.status(statusCode).json(response);
};

// Middleware xử lý 404
const notFound = (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      success: false,
      message: `API endpoint không tồn tại: ${req.method} ${req.path}`
    });
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>404 - Không tìm thấy trang</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container text-center mt-5">
          <h1 class="display-1">404</h1>
          <p class="lead">Trang bạn tìm không tồn tại</p>
          <a href="/" class="btn btn-primary">Về trang chủ</a>
        </div>
      </body>
      </html>
    `);
  }
};

module.exports = {
  errorHandler,
  notFound
};