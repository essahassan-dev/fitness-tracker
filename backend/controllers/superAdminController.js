const User       = require('../models/User');
const Workout    = require('../models/Workout');
const Nutrition  = require('../models/Nutrition');
const Attendance = require('../models/Attendance');
const Fee        = require('../models/Fee');
const UserStats  = require('../models/UserStats');
const Business   = require('../models/Business');
const Payment    = require('../models/Payment');
const SubscriptionRequest = require('../models/SubscriptionRequest');

// ── NEW: Full SaaS Dashboard Stats ────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (from && to && new Date(from) > new Date(to)) {
      return res.status(400).json({ success: false, message: 'Invalid date range: from must be before to' });
    }

    const now         = new Date();
    const startOfDay  = new Date(now.setHours(0,0,0,0));
    const startOfMonth= new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeFilter = from && to ? { $gte: new Date(from), $lte: new Date(to) } : null;

    const [
      totalBusinesses, activeBusinesses, suspendedBusinesses,
      trialBusinesses, expiredBusinesses,
      totalAdmins, totalTrainers, totalUsers,
      activeUsersToday, newUsersThisMonth,
      pendingRequests,
      revenueAgg, monthlyRevenueAgg,
    ] = await Promise.all([
      Business.countDocuments({ deletedAt: null }),
      Business.countDocuments({ status: 'active', deletedAt: null }),
      Business.countDocuments({ status: 'suspended', deletedAt: null }),
      Business.countDocuments({ status: 'trial', deletedAt: null }),
      Business.countDocuments({ status: 'expired', deletedAt: null }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'trainer' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', updatedAt: { $gte: startOfDay } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      SubscriptionRequest.countDocuments({ status: 'pending' }),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Chart data — scoped to date range if provided
    const chartMatch = rangeFilter ? { createdAt: rangeFilter } : {};
    const [businessGrowth, userGrowth, revenueOverTime, planDistribution, activeVsInactive] = await Promise.all([
      Business.aggregate([
        { $match: { ...chartMatch, deletedAt: null } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { ...chartMatch, role: 'user' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { ...chartMatch, status: 'completed' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      Business.aggregate([
        { $match: { deletedAt: null } },
        { $lookup: { from: 'subscriptionplans', localField: 'currentPlan', foreignField: '_id', as: 'plan' } },
        { $unwind: { path: '$plan', preserveNullAndEmpty: true } },
        { $group: { _id: '$plan.name', count: { $sum: 1 } } },
      ]),
      Business.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalBusinesses, activeBusinesses, suspendedBusinesses,
          trialBusinesses, expiredBusinesses,
          totalAdmins, totalTrainers, totalUsers,
          activeUsersToday, newUsersThisMonth,
          totalRevenue:   revenueAgg[0]?.total      || 0,
          monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
          pendingRequests,
          pendingSupportTickets: 0,
        },
        charts: { businessGrowth, userGrowth, revenueOverTime, planDistribution, activeVsInactive },
      },
    });
  } catch (err) { next(err); }
};

// ── Legacy: Platform overview ──────────────────────────────────────────────────
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalAdmins, totalTrainers, bannedUsers, premiumUsers,
      totalWorkouts, totalNutrition, totalFees, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'trainer' }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ 'subscription.type': 'PREMIUM', 'subscription.status': 'ACTIVE' }),
      Workout.countDocuments(),
      Nutrition.countDocuments(),
      Fee.countDocuments({ status: 'PAID' }),
      Fee.aggregate([{ $match: { status: 'PAID' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Recent admin activity (last 30 days)
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAdmins = await User.find({ role: 'admin' }).select('name email isActive createdAt').sort('-createdAt');

    res.json({
      success: true,
      data: {
        totalUsers, totalAdmins, totalTrainers, bannedUsers, premiumUsers,
        totalWorkouts, totalNutrition,
        paidFees: totalFees,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentAdmins,
      },
    });
  } catch (err) { next(err); }
};

// ── Get all admins ─────────────────────────────────────────────────────────────
const getAllAdmins = async (req, res, next) => {
  try {
    const { search = '', status = 'all' } = req.query;
    const query = { role: 'admin' };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const admins = await User.find(query).select('-password').sort('-createdAt');

    // Enrich with their platform usage
    const enriched = await Promise.all(admins.map(async (admin) => {
      const [userCount, trainerCount] = await Promise.all([
        User.countDocuments({ role: 'user' }), // simplified
        User.countDocuments({ role: 'trainer' }),
      ]);
      return { ...admin.toObject(), userCount, trainerCount };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

// ── Get admin details + their users/trainers ───────────────────────────────────
const getAdminDetail = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' }).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const [users, trainers, recentActivity] = await Promise.all([
      User.find({ role: 'user', isActive: true }).select('name email createdAt subscription').limit(10),
      User.find({ role: 'trainer' }).select('name email isActive').limit(10),
      Workout.find().sort('-createdAt').limit(5).populate('user', 'name'),
    ]);

    res.json({ success: true, data: { admin, users, trainers, recentActivity } });
  } catch (err) { next(err); }
};

// ── Ban/unban admin ────────────────────────────────────────────────────────────
const toggleAdminStatus = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    admin.isActive = !admin.isActive;
    await admin.save({ validateBeforeSave: false });

    const action = admin.isActive ? 'unbanned' : 'banned';
    console.log(`[SuperAdmin] Admin ${admin.email} ${action}. Reason: ${reason}`);

    // Notify the admin about their status change
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: admin._id,
        title: admin.isActive ? 'Account Reinstated' : 'Account Suspended',
        message: admin.isActive
          ? 'Your admin account has been reinstated by the platform owner.'
          : `Your admin account has been suspended by the platform owner.${reason ? ` Reason: ${reason}` : ' Please review the Rules & Regulations.'}`,
        type: admin.isActive ? 'success' : 'warning',
        link: '/rules',
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Admin ${admin.name} has been ${action}${reason ? `. Reason: ${reason}` : ''}`,
      data: { isActive: admin.isActive },
    });
  } catch (err) { next(err); }
};

// ── Create admin account ───────────────────────────────────────────────────────
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const admin = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({
      success: true,
      message: 'Admin account created',
      data: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) { next(err); }
};

// ── Delete admin and all data ──────────────────────────────────────────────────
const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (admin.role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot delete super admin' });

    await User.findByIdAndDelete(admin._id);
    res.json({ success: true, message: `Admin ${admin.name} deleted` });
  } catch (err) { next(err); }
};

// ── Platform-wide user list (all roles) ───────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { role = 'all', page = 1, limit = 20, search = '' } = req.query;
    const query = {};
    if (role !== 'all') query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Force ban any user ─────────────────────────────────────────────────────────
const banUser = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot ban super admin' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `${user.name} ${user.isActive ? 'unbanned' : 'banned'}` });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats, getPlatformStats, getAllAdmins, getAdminDetail, toggleAdminStatus, createAdmin, deleteAdmin, getAllUsers, banUser };
