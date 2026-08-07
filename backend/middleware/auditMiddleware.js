const AuditLog = require('../models/AuditLog');

/**
 * Auto-logs write operations on super-admin routes.
 * Attaches to POST/PUT/PATCH/DELETE methods.
 * Calls next() immediately — logging is non-blocking.
 */
const autoAuditLog = (actionType, targetEntity) => async (req, res, next) => {
  // Only log write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.user) return next();

  try {
    await AuditLog.create({
      actor:        req.user._id,
      actionType:   actionType || `${req.method}_${targetEntity || 'RESOURCE'}`,
      targetEntity: targetEntity || 'Setting',
      targetId:     req.params?.id || null,
      ipAddress:    req.ip || req.connection?.remoteAddress || null,
      outcome:      'success',
      description:  `${req.method} ${req.originalUrl}`,
    });
  } catch (_) {
    // Non-blocking — never fail the request due to audit log error
  }

  next();
};

module.exports = { autoAuditLog };
