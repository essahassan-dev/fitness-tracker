const SubscriptionRequest = require('../models/SubscriptionRequest');
const Business            = require('../models/Business');
const Payment             = require('../models/Payment');
const Notification        = require('../models/Notification');
const { withAudit }       = require('../utils/withAudit');

// ── List all subscription requests ────────────────────────────────────────────
const listRequests = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;

    const total = await SubscriptionRequest.countDocuments(query);
    const requests = await SubscriptionRequest.find(query)
      .populate('business', 'name logoUrl status adminUser')
      .populate('requestedPlan', 'name type price currency')
      .populate('currentPlan', 'name type')
      .populate('processedBy', 'name email')
      .sort('-requestedAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: requests, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Approve request ────────────────────────────────────────────────────────────
const approveRequest = async (req, res, next) => {
  try {
    const request = await SubscriptionRequest.findById(req.params.id)
      .populate('business')
      .populate('requestedPlan');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: `Request is already ${request.status}` });

    await withAudit(req, 'APPROVE_SUBSCRIPTION_REQUEST', 'Business', request.business._id, async () => {
      // Activate plan on Business
      await Business.findByIdAndUpdate(request.business._id, {
        currentPlan: request.requestedPlan._id,
        status: 'active',
        subscriptionStart: new Date(),
        subscriptionEnd: _calcEndDate(request.requestedPlan),
      });

      // Create payment record
      await Payment.create({
        business: request.business._id,
        plan: request.requestedPlan._id,
        amount: request.requestedPlan.price || 0,
        currency: request.requestedPlan.currency || 'USD',
        status: 'completed',
        paymentMethod: 'manual',
      });

      // Update request status
      request.status = 'approved';
      request.processedAt = new Date();
      request.processedBy = req.user._id;
      await request.save();

      // Notify business admin
      await Notification.create({
        user: request.business.adminUser,
        title: 'Subscription Approved',
        message: `Your subscription request for ${request.requestedPlan.name} has been approved. Enjoy your new plan!`,
        type: 'success',
        link: '/dashboard',
      });
    }, { targetName: request.business.name, description: `Approved subscription to ${request.requestedPlan.name}` });

    res.json({ success: true, message: 'Subscription approved. Business notified.' });
  } catch (err) { next(err); }
};

// ── Reject request ─────────────────────────────────────────────────────────────
const rejectRequest = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const request = await SubscriptionRequest.findById(req.params.id).populate('business').populate('requestedPlan');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: `Request is already ${request.status}` });

    await withAudit(req, 'REJECT_SUBSCRIPTION_REQUEST', 'Business', request.business._id, async () => {
      request.status = 'rejected';
      request.processedAt = new Date();
      request.processedBy = req.user._id;
      request.rejectionReason = reason;
      await request.save();

      await Notification.create({
        user: request.business.adminUser,
        title: 'Subscription Request Rejected',
        message: `Your subscription request for ${request.requestedPlan?.name || 'the requested plan'} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'warning',
        link: '/pricing',
      });
    }, { targetName: request.business.name, description: `Rejected subscription request. Reason: ${reason}` });

    res.json({ success: true, message: 'Request rejected. Business notified.' });
  } catch (err) { next(err); }
};

// ── Request more info ──────────────────────────────────────────────────────────
const requestMoreInfo = async (req, res, next) => {
  try {
    const { message = '' } = req.body;
    if (!message.trim()) return res.status(400).json({ success: false, message: 'A message is required' });

    const request = await SubscriptionRequest.findById(req.params.id).populate('business').populate('requestedPlan');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    await withAudit(req, 'REQUEST_MORE_INFO', 'Business', request.business._id, async () => {
      request.status = 'info-requested';
      request.infoMessage = message;
      request.processedAt = new Date();
      request.processedBy = req.user._id;
      await request.save();

      await Notification.create({
        user: request.business.adminUser,
        title: 'More Information Required',
        message: `Regarding your subscription request: ${message}`,
        type: 'info',
        link: '/dashboard',
      });
    }, { targetName: request.business.name, description: `Requested more info: ${message}` });

    res.json({ success: true, message: 'Info request sent to business.' });
  } catch (err) { next(err); }
};

// Helper: compute subscription end date based on plan type
function _calcEndDate(plan) {
  const now = new Date();
  if (!plan) return null;
  switch (plan.billingInterval) {
    case 'monthly': return new Date(now.setMonth(now.getMonth() + 1));
    case 'yearly':  return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'once':    return null; // Lifetime
    default:        return new Date(now.setMonth(now.getMonth() + 1));
  }
}

module.exports = { listRequests, approveRequest, rejectRequest, requestMoreInfo };
