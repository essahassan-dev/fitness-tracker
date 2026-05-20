const UpgradeRequest = require('../models/UpgradeRequest');
const User           = require('../models/User');

const PRICES = { monthly: 9.99, yearly: 79.99 };

// ── User: submit upgrade request ──────────────────────────────────────────────
const submitRequest = async (req, res, next) => {
  try {
    const { plan, payment } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }
    if (!payment?.method) {
      return res.status(400).json({ success: false, message: 'Payment method required' });
    }

    // Check if user already has a pending request
    const existing = await UpgradeRequest.findOne({ user: req.user._id, status: 'PENDING' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending upgrade request. Please wait for admin approval.',
      });
    }

    // Check if already premium
    const user = await User.findById(req.user._id);
    if (user.isPremium()) {
      return res.status(400).json({ success: false, message: 'You are already a Premium member.' });
    }

    // Sanitize payment — never store full card number
    const safePayment = {
      method:      payment.method,
      cardHolder:  payment.cardHolder  || '',
      cardLast4:   payment.cardLast4   ? String(payment.cardLast4).slice(-4) : '',
      bankName:    payment.bankName    || '',
      accountName: payment.accountName || '',
      transactionId: payment.transactionId || '',
    };

    const request = await UpgradeRequest.create({
      user:    req.user._id,
      plan,
      amount:  PRICES[plan],
      payment: safePayment,
    });

    res.status(201).json({
      success: true,
      message: 'Upgrade request submitted! Admin will review and activate your Premium within 24 hours.',
      data: request,
    });
  } catch (err) { next(err); }
};

// ── User: get their own request status ────────────────────────────────────────
const getMyRequest = async (req, res, next) => {
  try {
    const request = await UpgradeRequest.findOne({ user: req.user._id })
      .sort('-createdAt')
      .select('-payment.cardLast4');
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};

// ── Admin: get all pending requests ───────────────────────────────────────────
const getAllRequests = async (req, res, next) => {
  try {
    const { status = 'PENDING' } = req.query;
    const query = status === 'all' ? {} : { status };

    const requests = await UpgradeRequest.find(query)
      .populate('user', 'name email profile subscription')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');

    const pendingCount = await UpgradeRequest.countDocuments({ status: 'PENDING' });

    res.json({ success: true, data: requests, pendingCount });
  } catch (err) { next(err); }
};

// ── Admin: approve request ─────────────────────────────────────────────────────
const approveRequest = async (req, res, next) => {
  try {
    const { adminNote = '' } = req.body;
    const request = await UpgradeRequest.findById(req.params.id).populate('user');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    // Activate premium
    const durationDays = request.plan === 'yearly' ? 365 : 30;
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    await User.findByIdAndUpdate(request.user._id, {
      'subscription.type':      'PREMIUM',
      'subscription.status':    'ACTIVE',
      'subscription.startDate': startDate,
      'subscription.endDate':   endDate,
    });

    // Update request
    request.status     = 'APPROVED';
    request.adminNote  = adminNote;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: `Premium activated for ${request.user.name} (${durationDays} days)`,
      data: request,
    });
  } catch (err) { next(err); }
};

// ── Admin: reject request ──────────────────────────────────────────────────────
const rejectRequest = async (req, res, next) => {
  try {
    const { adminNote = '' } = req.body;
    const request = await UpgradeRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status     = 'REJECTED';
    request.adminNote  = adminNote;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Request rejected', data: request });
  } catch (err) { next(err); }
};

module.exports = { submitRequest, getMyRequest, getAllRequests, approveRequest, rejectRequest };
