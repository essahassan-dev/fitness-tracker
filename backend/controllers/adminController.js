const User = require('../models/User');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Progress = require('../models/Progress');

// ─── Platform Stats ────────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, newUsersThisMonth,
      totalWorkouts, workoutsThisWeek,
      totalNutritionEntries, totalProgressEntries,
      userGrowth, workoutGrowth,
      topActiveUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Workout.countDocuments(),
      Workout.countDocuments({ date: { $gte: sevenDaysAgo } }),
      Nutrition.countDocuments(),
      Progress.countDocuments(),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Workout.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Top 5 most active users by workout count
      Workout.aggregate([
        { $group: { _id: '$user', workouts: { $sum: 1 } } },
        { $sort: { workouts: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { workouts: 1, 'user.name': 1, 'user.email': 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        newUsersThisMonth, totalWorkouts, workoutsThisWeek,
        totalNutritionEntries, totalProgressEntries,
        userGrowth, workoutGrowth, topActiveUsers,
      },
    });
  } catch (error) { next(error); }
};

// ─── All Users (with enriched stats) ──────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search = '', role = 'all', status = 'all', sort = '-createdAt' } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role !== 'all') query.role = role;
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const total = await User.countDocuments(query);
    const users = await User.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit)).select('-password');

    const userIds = users.map((u) => u._id);

    const [workoutCounts, nutritionCounts, lastWorkouts] = await Promise.all([
      Workout.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
      ]),
      Nutrition.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 }, totalCalories: { $sum: '$totalCalories' } } },
      ]),
      Workout.aggregate([
        { $match: { user: { $in: userIds } } },
        { $sort: { date: -1 } },
        { $group: { _id: '$user', lastWorkout: { $first: '$date' } } },
      ]),
    ]);

    const wMap  = Object.fromEntries(workoutCounts.map((w) => [w._id.toString(), w]));
    const nMap  = Object.fromEntries(nutritionCounts.map((n) => [n._id.toString(), n]));
    const lwMap = Object.fromEntries(lastWorkouts.map((l) => [l._id.toString(), l.lastWorkout]));

    const enriched = users.map((u) => ({
      ...u.toObject(),
      workoutCount:    wMap[u._id.toString()]?.count || 0,
      totalDuration:   wMap[u._id.toString()]?.totalDuration || 0,
      nutritionCount:  nMap[u._id.toString()]?.count || 0,
      totalCaloriesIn: nMap[u._id.toString()]?.totalCalories || 0,
      lastWorkout:     lwMap[u._id.toString()] || null,
    }));

    res.json({ success: true, data: enriched, pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) } });
  } catch (error) { next(error); }
};

// ─── Full User Profile (admin view) ───────────────────────────────────────────
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      workouts, nutritionEntries, progressEntries,
      totalWorkouts, totalNutrition, totalProgress,
      calorieHistory, workoutFrequency, categoryBreakdown,
    ] = await Promise.all([
      Workout.find({ user: user._id }).sort('-date').limit(10),
      Nutrition.find({ user: user._id }).sort('-date').limit(10),
      Progress.find({ user: user._id }).sort('-date').limit(10),
      Workout.countDocuments({ user: user._id }),
      Nutrition.countDocuments({ user: user._id }),
      Progress.countDocuments({ user: user._id }),
      // Daily calorie intake last 30 days
      Nutrition.aggregate([
        { $match: { user: user._id, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, calories: { $sum: '$totalCalories' }, protein: { $sum: '$totalProtein' }, carbs: { $sum: '$totalCarbs' }, fat: { $sum: '$totalFat' } } },
        { $sort: { _id: 1 } },
      ]),
      // Workout frequency last 30 days
      Workout.aggregate([
        { $match: { user: user._id, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 }, duration: { $sum: '$duration' } } },
        { $sort: { _id: 1 } },
      ]),
      // Exercise category breakdown
      Workout.aggregate([
        { $match: { user: user._id } },
        { $unwind: '$exercises' },
        { $group: { _id: '$exercises.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Aggregate totals
    const totalCaloriesConsumed = await Nutrition.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: '$totalCalories' }, protein: { $sum: '$totalProtein' }, carbs: { $sum: '$totalCarbs' }, fat: { $sum: '$totalFat' } } },
    ]);

    const totalWorkoutDuration = await Workout.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: '$duration' } } },
    ]);

    const latestProgress = await Progress.findOne({ user: user._id }).sort('-date');

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalWorkouts, totalNutrition, totalProgress,
          totalCaloriesConsumed: totalCaloriesConsumed[0]?.total || 0,
          totalProtein:  totalCaloriesConsumed[0]?.protein || 0,
          totalCarbs:    totalCaloriesConsumed[0]?.carbs || 0,
          totalFat:      totalCaloriesConsumed[0]?.fat || 0,
          totalWorkoutMinutes: totalWorkoutDuration[0]?.total || 0,
          currentWeight: latestProgress?.weight || null,
          currentBodyFat: latestProgress?.bodyFat || null,
        },
        recentWorkouts: workouts,
        recentNutrition: nutritionEntries,
        recentProgress: progressEntries,
        charts: { calorieHistory, workoutFrequency, categoryBreakdown },
      },
    });
  } catch (error) { next(error); }
};

// ─── User's Workouts (paginated) ───────────────────────────────────────────────
const getUserWorkouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const total = await Workout.countDocuments({ user: user._id });
    const workouts = await Workout.find({ user: user._id })
      .sort('-date').skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: workouts, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

// ─── User's Nutrition (paginated) ─────────────────────────────────────────────
const getUserNutrition = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const total = await Nutrition.countDocuments({ user: user._id });
    const entries = await Nutrition.find({ user: user._id })
      .sort('-date').skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: entries, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

// ─── User's Progress ───────────────────────────────────────────────────────────
const getUserProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const entries = await Progress.find({ user: user._id }).sort('-date').limit(30);
    res.json({ success: true, data: entries });
  } catch (error) { next(error); }
};

// ─── Update Role ───────────────────────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot change your own role' });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: `Role updated to ${role}`, data: user });
  } catch (error) { next(error); }
};

// ─── Toggle Status ─────────────────────────────────────────────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: { isActive: user.isActive } });
  } catch (error) { next(error); }
};

// ─── Delete User ───────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Promise.all([
      Workout.deleteMany({ user: user._id }),
      Nutrition.deleteMany({ user: user._id }),
      Progress.deleteMany({ user: user._id }),
      User.findByIdAndDelete(user._id),
    ]);

    res.json({ success: true, message: 'User and all data deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  getStats, getAllUsers, getUserProfile,
  getUserWorkouts, getUserNutrition, getUserProgress,
  updateUserRole, toggleUserStatus, deleteUser,
};
