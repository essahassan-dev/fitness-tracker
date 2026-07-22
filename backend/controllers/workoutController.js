const Workout = require('../models/Workout');
const User = require('../models/User');
const { calcWorkoutCalories, calcExerciseCalories } = require('../utils/calorieCalc');
const { sendWorkoutComplete } = require('../utils/emailService');
const { notifyWorkoutLogged } = require('../utils/notificationService');

// Helper: get user body weight for calorie calc
const getUserWeight = async (userId) => {
  const user = await User.findById(userId).select('profile');
  return user?.profile?.weight || 70; // default 70kg
};

// Helper: enrich workout with calorie burn data
const enrichWithCalories = (workoutData, bodyWeight) => {
  const exercises = (workoutData.exercises || []).map((ex) => ({
    ...ex,
    caloriesBurned: calcExerciseCalories(ex, bodyWeight),
  }));
  const caloriesBurned = calcWorkoutCalories({ ...workoutData, exercises }, bodyWeight);
  return { ...workoutData, exercises, caloriesBurned };
};

// @desc    Get all workouts
// @route   GET /api/workouts
const getWorkouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, startDate, endDate, sort = '-date' } = req.query;
    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }
    if (search)                    query.title = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query['exercises.category'] = category;

    const total    = await Workout.countDocuments(query);
    const workouts = await Workout.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: workouts, pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) } });
  } catch (error) { next(error); }
};

// @desc    Get single workout
// @route   GET /api/workouts/:id
const getWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) return res.status(404).json({ success: false, message: 'Workout not found' });
    res.json({ success: true, data: workout });
  } catch (error) { next(error); }
};

// @desc    Create workout — auto-calculates calories burned
// @route   POST /api/workouts
const createWorkout = async (req, res, next) => {
  try {
    const bodyWeight = await getUserWeight(req.user._id);
    const enriched   = enrichWithCalories(req.body, bodyWeight);
    const workout    = await Workout.create({ ...enriched, user: req.user._id });

    // Send notification + email (non-blocking)
    const user = await User.findById(req.user._id).select('name email');
    notifyWorkoutLogged(req.user._id, workout.title, workout.caloriesBurned).catch(() => {});
    sendWorkoutComplete(user, workout).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Workout logged! ~${workout.caloriesBurned} kcal burned`,
      data: workout,
    });
  } catch (error) { next(error); }
};

// @desc    Update workout — recalculates calories burned
// @route   PUT /api/workouts/:id
const updateWorkout = async (req, res, next) => {
  try {
    const bodyWeight = await getUserWeight(req.user._id);
    const enriched   = enrichWithCalories(req.body, bodyWeight);
    const workout    = await Workout.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      enriched,
      { new: true, runValidators: true }
    );
    if (!workout) return res.status(404).json({ success: false, message: 'Workout not found' });
    res.json({ success: true, message: 'Workout updated', data: workout });
  } catch (error) { next(error); }
};

// @desc    Delete workout
// @route   DELETE /api/workouts/:id
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!workout) return res.status(404).json({ success: false, message: 'Workout not found' });
    res.json({ success: true, message: 'Workout deleted' });
  } catch (error) { next(error); }
};

// @desc    Get workout analytics
// @route   GET /api/workouts/analytics
const getWorkoutAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    const [frequency, categoryBreakdown, strengthProgress, totalStats, caloriesBurnedHistory] = await Promise.all([
      Workout.aggregate([
        { $match: { user: req.user._id, date: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 }, totalDuration: { $sum: '$duration' }, caloriesBurned: { $sum: '$caloriesBurned' } } },
        { $sort: { _id: 1 } },
      ]),
      Workout.aggregate([
        { $match: { user: req.user._id, date: { $gte: daysAgo } } },
        { $unwind: '$exercises' },
        { $group: { _id: '$exercises.category', count: { $sum: 1 } } },
      ]),
      Workout.aggregate([
        { $match: { user: req.user._id, date: { $gte: daysAgo } } },
        { $unwind: '$exercises' },
        { $match: { 'exercises.category': 'strength', 'exercises.weight': { $gt: 0 } } },
        { $group: { _id: { exercise: '$exercises.name', date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }, maxWeight: { $max: '$exercises.weight' }, totalVolume: { $sum: { $multiply: ['$exercises.sets', '$exercises.reps', '$exercises.weight'] } } } },
        { $sort: { '_id.date': 1 } },
      ]),
      Workout.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: null, totalWorkouts: { $sum: 1 }, totalDuration: { $sum: '$duration' }, avgDuration: { $avg: '$duration' }, totalCaloriesBurned: { $sum: '$caloriesBurned' } } },
      ]),
      // Calories burned per day
      Workout.aggregate([
        { $match: { user: req.user._id, date: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, caloriesBurned: { $sum: '$caloriesBurned' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        frequency,
        categoryBreakdown,
        strengthProgress,
        caloriesBurnedHistory,
        totalStats: totalStats[0] || { totalWorkouts: 0, totalDuration: 0, avgDuration: 0, totalCaloriesBurned: 0 },
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout, getWorkoutAnalytics };
