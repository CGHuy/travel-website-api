const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import middlewares
const requestLogger = require("./src/middlewares/logger");
const { errorHandler, notFound } = require("./src/middlewares/errorHandler");
const {
	generalLimiter,
	authLimiter,
	createLimiter,
	searchLimiter,
} = require("./src/middlewares/rateLimiter");

const app = express();

// ============ GLOBAL MIDDLEWARES ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(requestLogger);

// Rate limiter
app.use("/api", generalLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, "../frontend")));

// API routes
const tourRoutes = require("./src/routes/tourRoutes");
const authRoutes = require("./src/routes/authRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const userRoutes = require("./src/routes/userRoutes");
const depatureRoutes = require("./src/routes/depatureRoutes");

app.use("/api/tours", searchLimiter, tourRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/bookings", createLimiter, bookingRoutes);
app.use("/api/users", createLimiter, userRoutes);
app.use("/api/depatures", searchLimiter, depatureRoutes);


// ERROR HANDLERS
// 404 handler - phải đặt sau tất cả routes
app.use(notFound);

// Error handler - phải đặt cuối cùng
app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
	console.log(`
          🚀 VietTour Server đang chạy
          📍 Website:  http://localhost:${process.env.PORT || 3000}/pages/index.html
          📍 API:      http://localhost:${process.env.PORT || 3000}/api
          💾 Database: ${process.env.DB_NAME}
     `);
});

module.exports = app;
