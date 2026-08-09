const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// ── Google OAuth ───────────────────────────────────────────────────────────────
const googleEnabled = process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('your_google');

router.get('/google', (req, res, next) => {
  if (!googleEnabled) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  })(req, res, (err) => {
    if (err) return next(err);
    const token = require('jsonwebtoken').sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  });
});

router.get('/me',       protect, getMe);
router.put('/profile',  protect, updateProfile);
router.put('/password', protect, changePassword);

// ── Set use mode (personal / gym) ─────────────────────────────────────────────
router.put('/use-mode', protect, async (req, res, next) => {
  try {
    const { useMode } = req.body;
    if (!['personal', 'gym'].includes(useMode)) {
      return res.status(400).json({ success: false, message: 'useMode must be "personal" or "gym"' });
    }
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { useMode },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;
