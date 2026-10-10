const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me, updateProfile, changeEmail, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Slows down credential stuffing / brute force on the public endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in a few minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);
router.patch('/profile', protect, updateProfile);
router.patch('/email', protect, changeEmail);
router.patch('/password', protect, changePassword);

module.exports = router;
