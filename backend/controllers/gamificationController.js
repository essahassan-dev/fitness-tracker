const UserStats = require('../models/UserStats');
const { getOrCreate } = require('../utils/gamification');

// GET /api/gamification/me
const getMyStats = async (req, res, next) => {
  try {
    const stats = await getOrCreate(req.user._id);
    const xpForNext = stats.level * stats.level * 100;
    const progress  = Math.min(100, Math.round((stats.xp / xpForNext) * 100));
    res.json({ success: true, data: { ...stats.toObject(), xpForNext, levelProgress: progress } });
  } catch (err) { next(err); }
};

// GET /api/gamification/leaderboard?period=weekly
const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    let sortField = 'totalXP';
    if (period === 'weekly')  sortField = 'xp';
    if (period === 'monthly') sortField = 'xp';

    const leaders = await UserStats.find({ totalXP: { $gt: 0 } })
      .populate('user', 'name email profile')
      .sort({ [sortField]: -1 })
      .limit(20);

    const ranked = leaders
      .filter((s) => s.user != null)
      .map((s, i) => ({
        rank: i + 1,
        user: s.user,
        xp:   period === 'all' ? s.totalXP : s.xp,
        level: s.level,
        coins: s.coins,
        badges: s.badges.length,
        currentStreak: s.currentStreak,
      }));

    res.json({ success: true, data: ranked });
  } catch (err) { next(err); }
};

// GET /api/gamification/badges
const getAllBadges = async (req, res, next) => {
  try {
    const { BADGES } = require('../utils/gamification');
    const stats = await getOrCreate(req.user._id);
    const earned = stats.badges.map((b) => b.id);
    const allBadges = Object.values(BADGES).map((b) => ({
      ...b,
      earned: earned.includes(b.id),
      earnedAt: stats.badges.find((sb) => sb.id === b.id)?.earnedAt || null,
    }));
    res.json({ success: true, data: allBadges });
  } catch (err) { next(err); }
};

module.exports = { getMyStats, getLeaderboard, getAllBadges };
