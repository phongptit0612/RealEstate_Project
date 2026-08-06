const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validators');
// Public routes — with Joi validation
router.post('/register', validate(schemas.register), authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', validate(schemas.login), authController.login);
router.post('/logout', authController.logout);

// Password reset flow (public — no token needed)
router.post('/forgot-password', validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), authController.resetPassword);

// Protected routes (requires JWT cookie)
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, validate(schemas.changePassword), authController.changePassword);
router.post('/avatar', protect, authController.uploadAvatar);

// Public - agents directory
router.get('/agents', authController.getAgents);

module.exports = router;
