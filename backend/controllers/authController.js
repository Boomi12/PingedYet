const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Helper to sign JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'cyber_jwt_secret_token_key_9901', 
    { expiresIn: '30d' }
  );
};

// Helper to generate a 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user (Unverified, sends verification code)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check missing fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email address is already registered' });
    }

    const otp = generateOtp();

    // Create user (pre-save hook hashes password)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationCode: otp
    });

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'PingedYet - Verify Your Email Address',
      text: `Hello ${user.name},\n\nThank you for signing up for PingedYet!\n\nYour 6-digit verification code is: ${otp}\n\nPlease enter this code in the app to complete your registration.\n\nRegards,\nThe PingedYet Team`,
      html: `<p>Hello ${user.name},</p><p>Thank you for signing up for PingedYet!</p><p>Your 6-digit verification code is: <strong>${otp}</strong></p><p>Please enter this code in the app to complete your registration.</p><p>Regards,<br/>The PingedYet Team</p>`
    });

    return res.status(201).json({
      message: 'Registration successful. Verification code sent to email.',
      email: user.email,
    });
  } catch (error) {
    console.error('[Auth Controller] Registration error:', error.message);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

/**
 * @desc    Authenticate user & get token (Requires verification)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check missing fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Verify user and compare password hash
    if (user && (await user.comparePassword(password))) {
      // Guard: Block login if user is unverified
      if (!user.isVerified) {
        return res.status(401).json({ 
          message: 'Please verify your email address before logging in.',
          unverified: true,
          email: user.email
        });
      }

      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Auth Controller] Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};

/**
 * @desc    Verify signup email OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and verification code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email address is already verified' });
    }

    if (user.verificationCode !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    // Auto log in on verify
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[Auth Controller] Verify OTP error:', error.message);
    return res.status(500).json({ message: 'Server error verifying code' });
  }
};

/**
 * @desc    Resend registration email verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email address is already verified' });
    }

    const otp = generateOtp();
    user.verificationCode = otp;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'PingedYet - Verification Code',
      text: `Your new 6-digit verification code is: ${otp}\n\nPlease enter this code in the app to complete your registration.`,
      html: `<p>Your new 6-digit verification code is: <strong>${otp}</strong></p><p>Please enter this code in the app to complete your registration.</p>`
    });

    return res.json({ message: 'New verification code sent successfully' });
  } catch (error) {
    console.error('[Auth Controller] Resend OTP error:', error.message);
    return res.status(500).json({ message: 'Server error resending code' });
  }
};

/**
 * @desc    Send password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const otp = generateOtp();
    user.resetPasswordCode = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'PingedYet - Password Reset Code',
      text: `You requested a password reset. Your 6-digit reset code is: ${otp}\n\nThis code will expire in 15 minutes.`,
      html: `<p>You requested a password reset.</p><p>Your 6-digit reset code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`
    });

    return res.json({ message: 'Password reset code sent successfully' });
  } catch (error) {
    console.error('[Auth Controller] Forgot password error:', error.message);
    return res.status(500).json({ message: 'Server error sending password reset code' });
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, verification code, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      email,
      resetPasswordCode: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword; // Pre-save hook hashes this password automatically
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    user.isVerified = true; // Auto-verify on password reset
    await user.save();

    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('[Auth Controller] Reset password error:', error.message);
    return res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
};
