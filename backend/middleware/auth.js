const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired',
    });
  }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'super_admin') return next();
  return res.status(403).json({ success: false, message: 'Admin privileges required.' });
};

// Super admin only
const superAdminOnly = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  return res.status(403).json({ success: false, message: 'Super Admin access required.' });
};

// Premium-only middleware (must be used after protect)
const premiumOnly = (req, res, next) => {
  const sub = req.user?.subscription;
  const isPremium =
    sub?.type === 'PREMIUM' &&
    sub?.status === 'ACTIVE' &&
    (!sub?.endDate || new Date() <= new Date(sub.endDate));

  if (isPremium || req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Premium subscription required',
    code: 'PREMIUM_REQUIRED',
  });
};

module.exports = { protect, adminOnly, superAdminOnly, premiumOnly };
