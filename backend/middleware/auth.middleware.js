/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Auth Middleware (auth.middleware.js)
 * JWT verification for protected routes.
 * ═══════════════════════════════════════════════════════
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the authenticated user to req.user.
 */
async function protect(req, res, next) {
  let token;

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  try {
    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (excluding password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

module.exports = { protect };
