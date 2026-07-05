const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Route mapping
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
