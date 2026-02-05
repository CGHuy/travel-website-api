// Middleware Rate Limiter
// Sử dụng in-memory store cho ứng dụng nhỏ
// Cho production, nên sử dụng Redis store

const rateLimit = require('express-rate-limit');

// Giới hạn chung cho tất cả các request
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // 100 request/15 phút
  message: {
    success: false,
    message: 'Quá nhiều request từ địa chỉ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true, // Trả về thông tin rate limit trong headers
  legacyHeaders: false, // Tắt X-RateLimit-* headers
  skip: (req) => process.env.NODE_ENV === 'development', // Bỏ qua giới hạn trong development
});

// Giới hạn cho auth (đăng nhập, đăng ký)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // 5 attempt/15 phút
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập/đăng ký không thành công, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Không tính những request thành công
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Giới hạn cho API có thao tác dữ liệu (POST, PUT, DELETE)
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 30, // 30 request/phút
  message: {
    success: false,
    message: 'Quá nhiều request tạo mới, vui lòng chức từ từ'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Giới hạn cho search/list requests
const searchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 60, // 60 request/10 phút
  message: {
    success: false,
    message: 'Quá nhiều request tìm kiếm, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  searchLimiter
};