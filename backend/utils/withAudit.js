const AuditLog = require('../models/AuditLog');

async function withAudit(req, actionType, targetEntity, targetId, fn, options = {}) {
  const logDoc = await AuditLog.create({
    actor: req.user._id,
    actionType,
    targetEntity,
    targetId: targetId || null,
    targetName: options.targetName || null,
    description: options.description || null,
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    outcome: 'failure',
    metadata: options.metadata || null,
  });

  try {
    const result = await fn();
    // Use raw collection to bypass immutability hook
    await AuditLog.collection.updateOne(
      { _id: logDoc._id },
      { $set: { outcome: 'success' } }
    );
    return result;
  } catch (err) {
    // Leave outcome as 'failure'
    throw err;
  }
}

module.exports = { withAudit };
