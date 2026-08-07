const SubscriptionPlan = require('../models/SubscriptionPlan');
const Business        = require('../models/Business');
const { withAudit }   = require('../utils/withAudit');

// ── List all plans ─────────────────────────────────────────────────────────────
const listPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort('-createdAt');
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

// ── Create plan ────────────────────────────────────────────────────────────────
const createPlan = async (req, res, next) => {
  try {
    const plan = await withAudit(req, 'CREATE_PLAN', 'Plan', null, async () => {
      return SubscriptionPlan.create(req.body);
    }, { targetName: req.body.name, description: `Created plan: ${req.body.name}` });

    res.status(201).json({ success: true, data: plan });
  } catch (err) { next(err); }
};

// ── Update plan ────────────────────────────────────────────────────────────────
const updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const updated = await withAudit(req, 'UPDATE_PLAN', 'Plan', plan._id, async () => {
      return SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    }, { targetName: plan.name, description: `Updated plan: ${plan.name}` });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ── Toggle plan enabled/disabled ───────────────────────────────────────────────
const togglePlanStatus = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const updated = await withAudit(req, 'TOGGLE_PLAN_STATUS', 'Plan', plan._id, async () => {
      plan.isEnabled = !plan.isEnabled;
      return plan.save();
    }, { targetName: plan.name, description: `${plan.isEnabled ? 'Disabled' : 'Enabled'} plan: ${plan.name}` });

    res.json({ success: true, data: updated, message: `Plan ${updated.isEnabled ? 'enabled' : 'disabled'}` });
  } catch (err) { next(err); }
};

// ── Delete plan ────────────────────────────────────────────────────────────────
const deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Check for active subscriptions
    const activeCount = await Business.countDocuments({ currentPlan: plan._id, status: 'active' });
    if (activeCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${activeCount} business${activeCount > 1 ? 'es have' : ' has'} an active subscription on this plan`,
      });
    }

    await withAudit(req, 'DELETE_PLAN', 'Plan', plan._id, async () => {
      return SubscriptionPlan.findByIdAndDelete(req.params.id);
    }, { targetName: plan.name, description: `Deleted plan: ${plan.name}` });

    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) { next(err); }
};

module.exports = { listPlans, createPlan, updatePlan, togglePlanStatus, deletePlan };
