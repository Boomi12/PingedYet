const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if token is sent in the Authorization header as Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Decode token payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cyber_jwt_secret_token_key_9901');

      // Retrieve user from database and append to request, excluding password
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware] Token validation failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
