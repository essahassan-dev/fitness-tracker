const SuperAdminSession = require('../models/SuperAdminSession');

// ── List active sessions ───────────────────────────────────────────────────────
const listSessions = async (req, res, next) => {
  try {
    const sessions = await SuperAdminSession.find({ user: req.user._id, isActive: true })
      .sort('-lastSeenAt')
      .lean();
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
};

// ── Force logout a session ─────────────────────────────────────────────────────
const forceLogoutSession = async (req, res, next) => {
  try {
    const session = await SuperAdminSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.isActive = false;
    await session.save();

    res.json({ success: true, message: 'Session invalidated' });
  } catch (err) { next(err); }
};

module.exports = { listSessions, forceLogoutSession };
