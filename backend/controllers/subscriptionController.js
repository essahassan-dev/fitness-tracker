const User = require('../models/User');

// @desc    Get current subscription status
// @route   GET /api/subscription
const getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('subscription name email');
    const sub = user.subscription;
    const isPremium =
      sub?.type === 'PREMIUM' &&
      sub?.status === 'ACTIVE' &&
      (!sub?.endDate || new Date() <= new Date(sub.endDate));

    res.json({
      success: true,
      data: {
        ...sub.toObject(),
        isPremium,
        daysRemaining: sub?.endDate
          ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
          : null,
      },
    });
  } catch (err) { next(err); }
};

// @desc    Activate premium manually (admin or test mode)
// @route   POST /api/subscription/activate
const activatePremium = async (req, res, next) => {
  try {
    const { durationDays = 30 } = req.body;
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(endDate.getDate() + Number(durationDays));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'subscription.type':      'PREMIUM',
        'subscription.status':    'ACTIVE',
        'subscription.startDate': startDate,
        'subscription.endDate':   endDate,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Premium activated for ${durationDays} days 🎉`,
      data: user.subscription,
    });
  } catch (err) { next(err); }
};

// @desc    Cancel premium subscription
// @route   POST /api/subscription/cancel
const cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'subscription.status': 'CANCELLED' },
      { new: true }
    );
    res.json({ success: true, message: 'Subscription cancelled', data: user.subscription });
  } catch (err) { next(err); }
};

// @desc    Admin: manually set any user's subscription
// @route   PUT /api/subscription/admin/:userId
const adminSetSubscription = async (req, res, next) => {
  try {
    const { type, status, durationDays } = req.body;
    const update = {
      'subscription.type':   type   || 'FREE',
      'subscription.status': status || 'ACTIVE',
    };
    if (type === 'PREMIUM' && durationDays) {
      update['subscription.startDate'] = new Date();
      const end = new Date();
      end.setDate(end.getDate() + Number(durationDays));
      update['subscription.endDate'] = end;
    }
    const user = await User.findByIdAndUpdate(req.params.userId, update, { new: true }).select('name email subscription');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Subscription updated', data: user });
  } catch (err) { next(err); }
};

// @desc    Stripe webhook placeholder (ready for future integration)
// @route   POST /api/subscription/webhook
const stripeWebhook = async (req, res) => {
  // TODO: verify Stripe signature and handle events
  // Events to handle: checkout.session.completed, customer.subscription.deleted
  res.json({ received: true });
};

module.exports = { getSubscription, activatePremium, cancelSubscription, adminSetSubscription, stripeWebhook };
