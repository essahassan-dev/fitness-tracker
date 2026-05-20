const WeeklyPlan = require('../models/WeeklyPlan');
const User       = require('../models/User');
const { generateWeeklyPlan } = require('../utils/weeklyPlanGenerator');

// ── Get current week plan ─────────────────────────────────────────────────────
const getCurrentPlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('profile');
    const { equipmentType } = req.query; // optional: MACHINE | EQUIPMENT | NOTHING

    let plan = await WeeklyPlan.findOne({ user: req.user._id, isActive: true }).sort('-weekStart');

    const needsNew = !plan
      || new Date() > new Date(plan.weekEnd)
      || (user.profile?.goal && plan.goal !== user.profile.goal)
      || (equipmentType && plan.equipmentType !== equipmentType);

    if (needsNew) {
      await WeeklyPlan.updateMany({ user: req.user._id }, { isActive: false });
      const planData = generateWeeklyPlan(user.profile, equipmentType || plan?.equipmentType || 'MACHINE');
      plan = await WeeklyPlan.create({ ...planData, user: req.user._id });
    }

    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

// ── Regenerate plan with specific equipment ───────────────────────────────────
const regeneratePlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('profile');
    const { equipmentType = 'MACHINE' } = req.body;
    await WeeklyPlan.updateMany({ user: req.user._id }, { isActive: false });
    const planData = generateWeeklyPlan(user.profile, equipmentType);
    const plan = await WeeklyPlan.create({ ...planData, user: req.user._id });
    res.json({ success: true, message: 'New weekly plan generated!', data: plan });
  } catch (err) { next(err); }
};

// ── Toggle exercise complete ──────────────────────────────────────────────────
const toggleExercise = async (req, res, next) => {
  try {
    const { planId, dayNumber, exerciseIndex } = req.params;
    const plan = await WeeklyPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const day = plan.days.find((d) => d.dayNumber === Number(dayNumber));
    if (!day) return res.status(404).json({ success: false, message: 'Day not found' });

    const exercise = day.exercises[Number(exerciseIndex)];
    if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found' });

    exercise.completed   = !exercise.completed;
    exercise.completedAt = exercise.completed ? new Date() : null;

    const allDone = day.exercises.every((e) => e.completed);
    day.completed   = allDone;
    day.completedAt = allDone ? new Date() : null;

    plan.markModified('days');
    await plan.save();
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

// ── Toggle day complete ───────────────────────────────────────────────────────
const toggleDay = async (req, res, next) => {
  try {
    const { planId, dayNumber } = req.params;
    const plan = await WeeklyPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const day = plan.days.find((d) => d.dayNumber === Number(dayNumber));
    if (!day) return res.status(404).json({ success: false, message: 'Day not found' });

    // If marking complete — check all exercises are done first
    if (!day.completed && day.exercises.length > 0) {
      const allDone = day.exercises.every((e) => e.completed);
      if (!allDone) {
        return res.status(400).json({
          success: false,
          message: 'Complete all exercises first before marking the day as done',
        });
      }
    }

    day.completed   = !day.completed;
    day.completedAt = day.completed ? new Date() : null;

    // If unmarking — also unmark all exercises
    if (!day.completed) {
      day.exercises.forEach((ex) => {
        ex.completed   = false;
        ex.completedAt = null;
      });
    }

    plan.markModified('days');
    await plan.save();
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

// ── Plan history ──────────────────────────────────────────────────────────────
const getPlanHistory = async (req, res, next) => {
  try {
    const plans = await WeeklyPlan.find({ user: req.user._id }).sort('-weekStart').limit(8);
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

module.exports = { getCurrentPlan, regeneratePlan, toggleExercise, toggleDay, getPlanHistory };
