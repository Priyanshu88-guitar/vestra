/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Auth Routes (auth.routes.js)
 * POST /api/auth/signup
 * POST /api/auth/login
 * GET  /api/auth/me   (protected)
 * ═══════════════════════════════════════════════════════
 */

const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/* ─── HELPER: Generate JWT ─── */
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/* ─── HELPER: Send auth response ─── */
function sendAuthResponse(res, statusCode, user) {
  const token = generateToken(user._id);
  return res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
}

/* ═══════════════════════════════════════════════════════
   POST /api/auth/signup
   Register a new user.
   Body: { name, email, password }
   ═══════════════════════════════════════════════════════ */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate presence
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    // Create user (password hashed in pre-save hook)
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });

    sendAuthResponse(res, 201, user);

  } catch (err) {
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    console.error('[Auth] Signup error:', err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

/* ═══════════════════════════════════════════════════════
   POST /api/auth/login
   Authenticate a user and return a JWT.
   Body: { email, password }
   ═══════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Find user — explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      // Return generic message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    sendAuthResponse(res, 200, user);

  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET /api/auth/me
   Returns the currently authenticated user's profile.
   Requires: Bearer token
   ═══════════════════════════════════════════════════════ */
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ success: true, user: req.user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch profile.' });
  }
});

module.exports = router;
