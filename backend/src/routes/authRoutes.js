const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validation');

// Public routes - Không cần đăng nhập
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes - Cần đăng nhập
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/change-password', verifyToken, authController.changePassword);
router.post('/logout', authController.logout);
router.get('/verify', verifyToken, authController.verifyToken);

module.exports = router;