const WeeklyPlan = require('../models/WeeklyPlan');
const User       = require('../models/User');
const Workout    = require('../models/Workout');
const { generateWeeklyPlan } = require('../utils/weeklyPlanGenerator');
const { calcWorkoutCalories } = require('../utils/calorieCalc');
const gamification = require('../utils/gamification');
const { notifyWorkoutLogged } = require('../utils/notificationService');

// ── Auto-log a workout when a weekly plan day is completed ────────────────────
const autoLogWorkout = async (userId, day, plan) => {
  try {
    const user = await User.findById(userId).select('profile');
    const bodyWeight = user?.profile?.weight || 70;

    // Build exercise list from completed exercises
    const exercises = day.exercises
      .filter((ex) => ex.completed)
      .map((ex) => ({
        name:     ex.name,
        category: ex.category || 'strength',
        sets:     ex.sets     || null,
        reps:     ex.reps ? parseInt(ex.reps) || null : null,
        duration: ex.duration || null,
        notes:    'Auto-logged from weekly plan',
        caloriesBurned: 0,
      }));

    const workoutData = {
      user:     userId,
      title:    `${day.dayName} — ${day.focus}`,
      date:     new Date(),
      exercises,
      notes:    `Auto-logged from weekly plan (${plan.equipmentType || 'MACHINE'})`,
      completed: true,
      source:   'weekly_plan',
    };

    // Calculate calories
    const caloriesBurned = calcWorkoutCalories(workoutData, bodyWeight);
    workoutData.caloriesBurned = caloriesBurned;
    workoutData.exercises = workoutData.exercises.map((ex) => ({
      ...ex,
      caloriesBurned: Math.round(caloriesBurned / exercises.length),
    }));

    await Workout.create(workoutData);

    // ── Trigger gamification (same as manual workout) ──
    gamification.onWorkoutLogged(userId, caloriesBurned).catch(() => {});
    notifyWorkoutLogged(userId, workoutData.title, caloriesBurned).catch(() => {});

    return caloriesBurned;
  } catch (err) {
    console.error('Auto-log workout error:', err.message);
    return 0;
  }
};

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

    // Check if ALL exercises are now done
    const allDone = day.exercises.every((e) => e.completed);
    const wasDone = day.completed;

    day.completed   = allDone;
    day.completedAt = allDone ? new Date() : null;

    plan.markModified('days');
    await plan.save();

    // Auto-log workout when day completes for the first time
    let autoLoggedCalories = 0;
    if (allDone && !wasDone) {
      autoLoggedCalories = await autoLogWorkout(req.user._id, day, plan);
    }

    res.json({ success: true, data: plan, autoLoggedCalories, dayCompleted: allDone && !wasDone });
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

    if (!day.completed && day.exercises.length > 0) {
      const allDone = day.exercises.every((e) => e.completed);
      if (!allDone) {
        return res.status(400).json({
          success: false,
          message: 'Complete all exercises first before marking the day as done',
        });
      }
    }

    const wasDone = day.completed;
    day.completed   = !day.completed;
    day.completedAt = day.completed ? new Date() : null;

    if (!day.completed) {
      day.exercises.forEach((ex) => {
        ex.completed   = false;
        ex.completedAt = null;
      });
    }

    plan.markModified('days');
    await plan.save();

    // Auto-log workout when day marked complete
    let autoLoggedCalories = 0;
    if (day.completed && !wasDone) {
      autoLoggedCalories = await autoLogWorkout(req.user._id, day, plan);
    }

    res.json({ success: true, data: plan, autoLoggedCalories, dayCompleted: day.completed && !wasDone });
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
