const Violation  = require('../models/Violation');
const User       = require('../models/User');
const notificationService = require('../utils/notificationService');

// Helper — send an in-app notification via existing service
const sendNotification = async (userId, title, message, type = 'warning', link = '') => {
  try {
    const Notification = require('../models/Notification');
    await Notification.create({ user: userId, title, message, type, link });
  } catch (err) { console.error('Notification error:', err.message); }
};

// ── List of official rules ─────────────────────────────────────────────────────
const RULES_LIST = [
  {
    id: 'R01',
    title: 'No Harassment or Abusive Behaviour',
    description: 'All users must treat others with respect. Harassment, verbal abuse, hate speech, or threatening behaviour toward any user, trainer, or admin is strictly prohibited.',
    severity: 'critical',
  },
  {
    id: 'R02',
    title: 'Accurate Information Only',
    description: 'Users must provide truthful information in their profile, attendance requests, and communications. False claims, fabricated data, or misrepresentation will result in account suspension.',
    severity: 'severe',
  },
  {
    id: 'R03',
    title: 'No Spam or Misuse of Platform',
    description: 'Do not flood the system with repetitive requests, false attendance marks, or abuse any platform feature. Systematic misuse will be flagged automatically.',
    severity: 'warning',
  },
  {
    id: 'R04',
    title: 'Respect Privacy',
    description: 'Do not attempt to access, copy, or share another user\'s personal data, workout plans, nutrition records, or any private information.',
    severity: 'critical',
  },
  {
    id: 'R05',
    title: 'Admin Conduct Standards',
    description: 'Admins must manage the platform fairly and responsibly. Favouritism, unauthorized data access, manipulation of fee records, or misuse of admin privileges is a violation.',
    severity: 'critical',
  },
  {
    id: 'R06',
    title: 'Payment Integrity',
    description: 'All fee payments and subscription upgrades must be legitimate. Fraudulent payment claims, chargebacks without cause, or tampering with fee records is prohibited.',
    severity: 'severe',
  },
  {
    id: 'R07',
    title: 'Fair Use of AI & Recommendations',
    description: 'AI features must not be misused to generate or spread false health information. Attempting to manipulate AI outputs or exploit platform intelligence is not permitted.',
    severity: 'warning',
  },
  {
    id: 'R08',
    title: 'No Account Sharing',
    description: 'Each account is for a single individual only. Sharing login credentials, using another person\'s account, or creating multiple accounts for the same person is not allowed.',
    severity: 'severe',
  },
  {
    id: 'R09',
    title: 'Trainer Professionalism',
    description: 'Trainers must provide accurate, professional guidance. Giving harmful advice, ignoring client safety, or misusing access to client data are violations of trainer conduct.',
    severity: 'critical',
  },
  {
    id: 'R10',
    title: 'Terms of Service Compliance',
    description: 'All users must comply with FitStack\'s full Terms of Service. Violations of any legal or community guideline not listed above may still result in account action.',
    severity: 'severe',
  },
];

// ── GET /violations/rules — public list of all rules ──────────────────────────
const getRules = (req, res) => {
  res.json({ success: true, data: RULES_LIST });
};

// ── POST /violations — super admin files a violation ──────────────────────────
const createViolation = async (req, res, next) => {
  try {
    const { userId, rule, description, severity = 'warning' } = req.body;
    if (!userId || !rule || !description)
      return res.status(400).json({ success: false, message: 'userId, rule, and description are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'super_admin')
      return res.status(403).json({ success: false, message: 'Cannot file violation against super admin' });

    const violation = await Violation.create({
      user: userId,
      reportedBy: req.user._id,
      rule,
      description,
      severity,
    });

    // Notify the violating user
    await sendNotification(
      userId,
      'Rules Violation Warning',
      `A violation has been filed on your account. Rule broken: "${rule}". Reason: ${description}. Please review the Rules & Regulations.`,
      'warning',
      '/rules',
    );

    // Auto-blacklist if critical severity
    if (severity === 'critical') {
      user.isActive = false;
      await user.save({ validateBeforeSave: false });
    }

    const populated = await violation.populate('user', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// ── GET /violations — super admin view all violations ─────────────────────────
const getAllViolations = async (req, res, next) => {
  try {
    const { status = 'all', severity = 'all', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status !== 'all')   query.status = status;
    if (severity !== 'all') query.severity = severity;

    const total = await Violation.countDocuments(query);
    const violations = await Violation.find(query)
      .populate('user', 'name email role isActive')
      .populate('reportedBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: violations, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── GET /violations/user/:userId — violations for a specific user ─────────────
const getUserViolations = async (req, res, next) => {
  try {
    const violations = await Violation.find({ user: req.params.userId })
      .populate('reportedBy', 'name role')
      .sort('-createdAt');
    res.json({ success: true, data: violations });
  } catch (err) { next(err); }
};

// ── PUT /violations/:id/resolve — mark resolved ───────────────────────────────
const resolveViolation = async (req, res, next) => {
  try {
    const { resolvedNote = '' } = req.body;
    const violation = await Violation.findById(req.params.id).populate('user', 'name email isActive');
    if (!violation) return res.status(404).json({ success: false, message: 'Violation not found' });

    violation.status = 'resolved';
    violation.resolvedAt = new Date();
    violation.resolvedNote = resolvedNote;
    await violation.save();

    // Unban the user if they were auto-banned and this is their only active violation
    const activeViolations = await Violation.countDocuments({ user: violation.user._id, status: 'active', severity: 'critical' });
    if (activeViolations === 0 && !violation.user.isActive) {
      await User.findByIdAndUpdate(violation.user._id, { isActive: true });
    }

    res.json({ success: true, data: violation });
  } catch (err) { next(err); }
};

// ── PUT /violations/:id/dismiss — dismiss without action ─────────────────────
const dismissViolation = async (req, res, next) => {
  try {
    const violation = await Violation.findById(req.params.id);
    if (!violation) return res.status(404).json({ success: false, message: 'Violation not found' });

    violation.status = 'dismissed';
    violation.resolvedAt = new Date();
    await violation.save();

    res.json({ success: true, data: violation });
  } catch (err) { next(err); }
};

// ── GET /violations/blacklist — all currently banned users with reasons ────────
const getBlacklist = async (req, res, next) => {
  try {
    const bannedUsers = await User.find({ isActive: false, role: { $ne: 'super_admin' } })
      .select('name email role createdAt')
      .sort('-updatedAt');

    // Enrich with their latest violation reason
    const enriched = await Promise.all(bannedUsers.map(async (u) => {
      const latestViolation = await Violation.findOne({ user: u._id, status: 'active' })
        .sort('-createdAt').select('rule description severity createdAt');
      return { ...u.toObject(), latestViolation };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

// ── POST /violations/report — any user reports a rule breach ──────────────────
const reportViolation = async (req, res, next) => {
  try {
    const { targetUserId, rule, description } = req.body;
    if (!targetUserId || !rule || !description)
      return res.status(400).json({ success: false, message: 'targetUserId, rule, and description are required' });

    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ success: false, message: 'Target user not found' });
    if (target.role === 'super_admin')
      return res.status(403).json({ success: false, message: 'Cannot report super admin' });

    // Create a pending violation (status: active, reportedBy = reporter)
    const violation = await Violation.create({
      user: targetUserId,
      reportedBy: req.user._id,
      rule,
      description,
      severity: 'warning', // starts as warning, super admin can escalate
    });

    // Notify all super admins
    const superAdmins = await User.find({ role: 'super_admin' }).select('_id');
    const reporterName = req.user.name || 'A user';
    const targetName = target.name || 'a user';
    await Promise.all(
      superAdmins.map((sa) =>
        sendNotification(
          sa._id,
          'Violation Report Submitted',
          `${reporterName} reported ${targetName} (${target.role}) for: "${rule}". Details: ${description}`,
          'warning',
          '/super-admin/violations',
        )
      )
    );

    const populated = await violation.populate('user', 'name email role');
    res.status(201).json({ success: true, data: populated, message: 'Report submitted. Super admin has been notified.' });
  } catch (err) { next(err); }
};

module.exports = {
  getRules,
  createViolation,
  getAllViolations,
  getUserViolations,
  resolveViolation,
  dismissViolation,
  getBlacklist,
  reportViolation,
};
