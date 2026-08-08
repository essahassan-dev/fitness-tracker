const Business            = require('../models/Business');
const User                = require('../models/User');
const Workout             = require('../models/Workout');
const Nutrition           = require('../models/Nutrition');
const Fee                 = require('../models/Fee');
const Notification        = require('../models/Notification');
const SubscriptionPlan    = require('../models/SubscriptionPlan');
const { withAudit }       = require('../utils/withAudit');
const { getTenantUserIds} = require('../utils/getTenantUserIds');

// ── List businesses ────────────────────────────────────────────────────────────
const listBusinesses = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 15, search = '',
      status = 'all', plan = 'all',
      sort = '-createdAt',
    } = req.query;

    // Strategy: query admins directly, then enrich with Business doc if exists
    const userQuery = { role: 'admin', _id: { $ne: req.user._id } }; // exclude super_admin acting as admin
    if (search) {
      userQuery.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [admins, businesses] = await Promise.all([
      User.find(userQuery).select('name email phone isActive createdAt').sort(sort),
      Business.find().populate('adminUser', 'name email').populate('currentPlan', 'name type price'),
    ]);

    // Map business by adminUser _id
    const bizMap = {};
    businesses.forEach(b => { if (b.adminUser) bizMap[b.adminUser._id.toString()] = b; });

    // Merge: create virtual business entry for each admin
    let merged = admins.map(admin => {
      const biz = bizMap[admin._id.toString()];
      return {
        _id:          biz?._id || admin._id,
        isVirtual:    !biz, // no Business doc yet
        name:         biz?.name || admin.name,
        logoUrl:      biz?.logoUrl || '',
        country:      biz?.country || '',
        city:         biz?.city || '',
        phone:        biz?.phone || admin.phone || '',
        status:       biz?.status || (admin.isActive ? 'active' : 'suspended'),
        currentPlan:  biz?.currentPlan || null,
        storageUsedMB: biz?.storageUsedMB || 0,
        subscriptionEnd: biz?.subscriptionEnd || null,
        createdAt:    biz?.createdAt || admin.createdAt,
        adminUser:    { _id: admin._id, name: admin.name, email: admin.email },
        trainerCount: 0,
        userCount:    0,
      };
    });

    // Apply status filter
    if (status !== 'all') merged = merged.filter(b => b.status === status);

    // Enrich trainer/user counts
    const enriched = await Promise.all(merged.map(async (biz) => {
      const [trainerCount, userCount] = await Promise.all([
        User.countDocuments({ businessId: biz.adminUser._id, role: 'trainer' }),
        User.countDocuments({ businessId: biz.adminUser._id, role: 'user' }),
      ]);
      return { ...biz, trainerCount, userCount };
    }));

    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    res.json({ success: true, data: paginated, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Get business detail ────────────────────────────────────────────────────────
const getBusinessDetail = async (req, res, next) => {
  try {
    const biz = await Business.findById(req.params.id)
      .populate('adminUser',   'name email phone role')
      .populate('currentPlan', 'name type price features');

    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    if (biz.deletedAt) return res.status(410).json({ success: false, message: 'Business has been deleted' });

    const tenantIds = await getTenantUserIds(biz._id);

    const [trainers, users, recentWorkouts, recentNutrition] = await Promise.all([
      User.find({ businessId: biz._id, role: 'trainer' }).select('name email isActive createdAt').limit(20),
      User.find({ businessId: biz._id, role: 'user' }).select('name email isActive subscription createdAt').limit(20),
      Workout.find({ user: { $in: tenantIds } }).sort('-date').limit(5).populate('user', 'name'),
      Nutrition.find({ user: { $in: tenantIds } }).sort('-date').limit(5).populate('user', 'name'),
    ]);

    const [workoutCount, nutritionCount] = await Promise.all([
      Workout.countDocuments({ user: { $in: tenantIds } }),
      Nutrition.countDocuments({ user: { $in: tenantIds } }),
    ]);

    res.json({
      success: true,
      data: {
        business: biz,
        stats: { trainerCount: trainers.length, userCount: users.length, workoutCount, nutritionCount },
        trainers,
        users,
        recentWorkouts,
        recentNutrition,
      },
    });
  } catch (err) { next(err); }
};

// ── Update business ────────────────────────────────────────────────────────────
const updateBusiness = async (req, res, next) => {
  try {
    const biz = await Business.findById(req.params.id);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });

    const updated = await withAudit(req, 'UPDATE_BUSINESS', 'Business', biz._id, async () => {
      return Business.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    }, { targetName: biz.name, description: `Updated business profile` });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ── Suspend business ───────────────────────────────────────────────────────────
const suspendBusiness = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const biz = await Business.findById(req.params.id);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    if (biz.status === 'suspended') return res.status(400).json({ success: false, message: 'Business is already suspended' });

    await withAudit(req, 'SUSPEND_BUSINESS', 'Business', biz._id, async () => {
      biz.status = 'suspended';
      await biz.save();
      await Notification.create({
        user: biz.adminUser,
        title: 'Account Suspended',
        message: `Your business account has been suspended.${reason ? ` Reason: ${reason}` : ' Please contact support.'}`,
        type: 'warning',
        link: '/dashboard',
      });
    }, { targetName: biz.name, description: `Suspended business. Reason: ${reason}` });

    res.json({ success: true, message: `${biz.name} has been suspended` });
  } catch (err) { next(err); }
};

// ── Activate business ──────────────────────────────────────────────────────────
const activateBusiness = async (req, res, next) => {
  try {
    const biz = await Business.findById(req.params.id);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });

    await withAudit(req, 'ACTIVATE_BUSINESS', 'Business', biz._id, async () => {
      biz.status = 'active';
      await biz.save();
      await Notification.create({
        user: biz.adminUser,
        title: 'Account Reactivated',
        message: 'Your business account has been reactivated. Welcome back!',
        type: 'success',
        link: '/dashboard',
      });
    }, { targetName: biz.name, description: 'Activated business' });

    res.json({ success: true, message: `${biz.name} has been activated` });
  } catch (err) { next(err); }
};

// ── Soft delete business ───────────────────────────────────────────────────────
const softDeleteBusiness = async (req, res, next) => {
  try {
    const biz = await Business.findById(req.params.id);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });

    await withAudit(req, 'DELETE_BUSINESS', 'Business', biz._id, async () => {
      biz.deletedAt = new Date();
      biz.status = 'deleted';
      return biz.save();
    }, { targetName: biz.name, description: 'Soft-deleted business' });

    res.json({ success: true, message: `${biz.name} has been deleted` });
  } catch (err) { next(err); }
};

// ── Change plan ────────────────────────────────────────────────────────────────
const changeBusinessPlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ success: false, message: 'planId is required' });

    const [biz, plan] = await Promise.all([
      Business.findById(req.params.id),
      SubscriptionPlan.findById(planId),
    ]);
    if (!biz)  return res.status(404).json({ success: false, message: 'Business not found' });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    await withAudit(req, 'CHANGE_PLAN', 'Business', biz._id, async () => {
      biz.currentPlan = plan._id;
      biz.subscriptionStart = new Date();
      return biz.save();
    }, { targetName: biz.name, description: `Changed plan to ${plan.name}` });

    res.json({ success: true, message: `Plan changed to ${plan.name}` });
  } catch (err) { next(err); }
};

// ── Extend subscription ────────────────────────────────────────────────────────
const extendSubscription = async (req, res, next) => {
  try {
    const { days } = req.body;
    if (!days || days <= 0) return res.status(400).json({ success: false, message: 'days must be a positive number' });

    const biz = await Business.findById(req.params.id);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });

    await withAudit(req, 'EXTEND_SUBSCRIPTION', 'Business', biz._id, async () => {
      const base = biz.subscriptionEnd || new Date();
      biz.subscriptionEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      return biz.save();
    }, { targetName: biz.name, description: `Extended subscription by ${days} days` });

    res.json({ success: true, message: `Subscription extended by ${days} days` });
  } catch (err) { next(err); }
};

// ── Reset admin password ───────────────────────────────────────────────────────
const resetAdminPassword = async (req, res, next) => {
  try {
    const biz = await Business.findById(req.params.id).populate('adminUser', 'email name');
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });

    await withAudit(req, 'RESET_ADMIN_PASSWORD', 'Business', biz._id, async () => {
      // Trigger notification — actual email reset handled by existing auth flow
      await Notification.create({
        user: biz.adminUser._id,
        title: 'Password Reset Requested',
        message: 'A password reset has been initiated for your admin account by the platform owner. Please check your email.',
        type: 'warning',
        link: '/login',
      });
    }, { targetName: biz.name, description: `Reset password for admin ${biz.adminUser.email}` });

    res.json({ success: true, message: `Password reset notification sent to ${biz.adminUser.email}` });
  } catch (err) { next(err); }
};

module.exports = {
  listBusinesses, getBusinessDetail, updateBusiness,
  suspendBusiness, activateBusiness, softDeleteBusiness,
  changeBusinessPlan, extendSubscription, resetAdminPassword,
};
