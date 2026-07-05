const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to sign JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'cyber_jwt_secret_token_key_9901', 
    { expiresIn: '30d' }
  );
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
      return res.status(400).json({ message: 'Email address is already registered' });
    }

    // Create user (pre-save hook hashes password)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      return res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token: generateToken(user._id),
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

module.exports = {
  registerUser,
  loginUser,
};
