const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import middlewares
const requestLogger = require('./src/middlewares/logger');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');
const {
  generalLimiter,
  authLimiter,
  createLimiter,
  searchLimiter
} = require('./src/middlewares/rateLimiter');

const app = express();

// ============ GLOBAL MIDDLEWARES ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(requestLogger);

// Rate limiter
app.use('/api', generalLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============ API ROUTES ============
const tourRoutes = require('./src/routes/tourRoutes');
const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');

app.use('/api/tours', searchLimiter, tourRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bookings', createLimiter, bookingRoutes);

// Test API
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is working!',
    timestamp: new Date()
  });
});

// ============ FRONTEND ROUTES ============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/tours', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/admin/tour.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/user/profile.html'));
});

// ============ ERROR HANDLERS ============
// 404 handler - phải đặt sau tất cả routes
app.use(notFound);

// Error handler - phải đặt cuối cùng
app.use(errorHandler);

module.exports = app;