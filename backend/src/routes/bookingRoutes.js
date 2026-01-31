const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, isAdmin, isUser } = require('../middlewares/auth');
const { validateBooking } = require('../middlewares/validation');

// User routes - Cần đăng nhập
router.post('/', verifyToken, isUser, validateBooking, bookingController.createBooking);
router.get('/my-bookings', verifyToken, isUser, bookingController.getMyBookings);
router.put('/:id/cancel', verifyToken, isUser, bookingController.cancelBooking);

// Admin routes - Cần quyền admin
router.get('/', verifyToken, isAdmin, bookingController.getAllBookings);
router.put('/:id/status', verifyToken, isAdmin, bookingController.updateStatus);
router.delete('/:id', verifyToken, isAdmin, bookingController.deleteBooking);

module.exports = router;