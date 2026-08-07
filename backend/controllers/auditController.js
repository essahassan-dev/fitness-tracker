const AuditLog = require('../models/AuditLog');

// ── List audit logs ────────────────────────────────────────────────────────────
const listAuditLogs = async (req, res, next) => {
  try {
    const { actionType, targetEntity, outcome, from, to, page = 1, limit = 25 } = req.query;
    const query = {};

    if (actionType)   query.actionType   = actionType;
    if (targetEntity) query.targetEntity = targetEntity;
    if (outcome)      query.outcome      = outcome;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to);
    }

    const total = await AuditLog.countDocuments(query);
    const logs  = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

module.exports = { listAuditLogs };
