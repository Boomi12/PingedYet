const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/emailService');

// Helper to sign JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'cyber_jwt_secret_token_key_9901', 
    { expiresIn: '30d' }
  );
};

// Helper to generate 6-digit OTP code
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user
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
      // If user exists but is not verified, overwrite or generate a new verification code
      if (!userExists.isVerified) {
        const otp = generateOtp();
        userExists.name = name;
        userExists.password = password; // pre-save hook will hash it
        userExists.otp = otp;
        userExists.otpExpires = Date.now() + 15 * 60 * 1000;
        await userExists.save();

        await sendOtpEmail(userExists.email, userExists.name, otp, 'VERIFICATION');
        return res.status(201).json({
          message: 'An unverified account already exists with this email. A new verification code has been sent.',
          email: userExists.email
        });
      }
      return res.status(400).json({ message: 'Email address is already registered' });
    }

    // Generate verification code
    const otp = generateOtp();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    // Create user (pre-save hook hashes password)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      otp,
      otpExpires,
    });

    if (user) {
      // Send verification email via Resend
      await sendOtpEmail(user.email, user.name, otp, 'VERIFICATION');

      return res.status(201).json({
        message: 'Registration successful. Please check your email for the verification code.',
        email: user.email
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    console.error('[Auth Controller] Registration error:', error.message);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

/**
 * @desc    Authenticate user & get token
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
      // Check verification status
      if (!user.isVerified) {
        // Generate new OTP and send
        const otp = generateOtp();
        user.otp = otp;
        user.otpExpires = Date.now() + 15 * 60 * 1000;
        await user.save();
        await sendOtpEmail(user.email, user.name, otp, 'VERIFICATION');

        return res.status(403).json({ 
          message: 'Email address is not verified. A verification code has been sent to your email.', 
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
 * @desc    Verify OTP for registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[Auth Controller] OTP verification error:', error.message);
    return res.status(500).json({ message: 'Internal server error during OTP verification' });
  }
};

/**
 * @desc    Resend OTP verification code
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send email
    await sendOtpEmail(user.email, user.name, otp, 'VERIFICATION');

    return res.json({ message: 'Verification code resent successfully' });
  } catch (error) {
    console.error('[Auth Controller] OTP resend error:', error.message);
    return res.status(500).json({ message: 'Internal server error during OTP resend' });
  }
};

/**
 * @desc    Forgot password request (send OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user does not exist
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    // Generate reset OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send reset instructions email
    await sendOtpEmail(user.email, user.name, otp, 'RESET');

    return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
  } catch (error) {
    console.error('[Auth Controller] Forgot password error:', error.message);
    return res.status(500).json({ message: 'Internal server error during request' });
  }
};

/**
 * @desc    Reset password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate OTP and expiration
    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Update password (pre-save hook hashes password)
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    // Automatically verify user if resetting password
    user.isVerified = true;
    await user.save();

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('[Auth Controller] Reset password error:', error.message);
    return res.status(500).json({ message: 'Internal server error resetting password' });
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
