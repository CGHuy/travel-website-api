const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import middlewares
const requestLogger = require('./src/middlewares/logger');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');
const rateLimiter = require('./src/middlewares/rateLimiter');

const app = express();

// ============ GLOBAL MIDDLEWARES ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(requestLogger);

// Rate limiter (100 requests per 15 minutes)
app.use('/api', rateLimiter(100, 15 * 60 * 1000));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============ API ROUTES ============
const tourRoutes = require('./src/routes/tourRoutes');
const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');

app.use('/api/tours', tourRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

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
  res.sendFile(path.join(__dirname, '../tour-frontend/pages/index.html'));
});

app.get('/tours', (req, res) => {
  res.sendFile(path.join(__dirname, '../tour-frontend/pages/tours.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// ============ ERROR HANDLERS ============
// 404 handler - phải đặt sau tất cả routes
app.use(notFound);

// Error handler - phải đặt cuối cùng
app.use(errorHandler);

module.exports = app;