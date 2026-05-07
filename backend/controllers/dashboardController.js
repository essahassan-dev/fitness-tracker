const Workout   = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Progress  = require('../models/Progress');
const User      = require('../models/User');
const { calcTDEE, calcMacroGoals } = require('../utils/calorieCalc');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      recentWorkouts,
      todayNutrition,
      todayWorkouts,
      weeklyWorkoutCount,
      latestProgress,
      totalWorkouts,
      monthlyCalories,
      monthlyBurned,
      user,
    ] = await Promise.all([
      Workout.find({ user: userId }).sort('-date').limit(5),
      Nutrition.find({ user: userId, date: { $gte: today, $lte: todayEnd } }),
      Workout.find({ user: userId, date: { $gte: today, $lte: todayEnd } }),
      Workout.countDocuments({ user: userId, date: { $gte: weekAgo } }),
      Progress.findOne({ user: userId }).sort('-date'),
      Workout.countDocuments({ user: userId }),
      // Daily calories consumed (last 30 days)
      Nutrition.aggregate([
        { $match: { user: userId, date: { $gte: monthAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, calories: { $sum: '$totalCalories' }, protein: { $sum: '$totalProtein' }, carbs: { $sum: '$totalCarbs' }, fat: { $sum: '$totalFat' } } },
        { $sort: { _id: 1 } },
      ]),
      // Daily calories burned (last 30 days)
      Workout.aggregate([
        { $match: { user: userId, date: { $gte: monthAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, caloriesBurned: { $sum: '$caloriesBurned' } } },
        { $sort: { _id: 1 } },
      ]),
      User.findById(userId).select('profile'),
    ]);

    // Today's nutrition totals
    const todayCaloriesIn  = todayNutrition.reduce((s, e) => s + e.totalCalories, 0);
    const todayProtein     = todayNutrition.reduce((s, e) => s + e.totalProtein,  0);
    const todayCarbs       = todayNutrition.reduce((s, e) => s + e.totalCarbs,    0);
    const todayFat         = todayNutrition.reduce((s, e) => s + e.totalFat,      0);

    // Today's calories burned
    const todayCaloriesBurned = todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);

    // Net balance: consumed - burned (positive = surplus, negative = deficit)
    const netCalories = Math.round(todayCaloriesIn - todayCaloriesBurned);

    // TDEE and macro goals based on user profile
    const tdee       = calcTDEE(user?.profile);
    const macroGoals = calcMacroGoals(tdee, user?.profile?.goal);

    // Merge monthly consumed + burned into one timeline
    const burnedMap = Object.fromEntries(monthlyBurned.map((d) => [d._id, d.caloriesBurned]));
    const monthlyBalance = monthlyCalories.map((d) => ({
      date:          d._id,
      consumed:      d.calories,
      burned:        burnedMap[d._id] || 0,
      net:           d.calories - (burnedMap[d._id] || 0),
      protein:       d.protein,
      carbs:         d.carbs,
      fat:           d.fat,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalWorkouts,
          weeklyWorkouts:    weeklyWorkoutCount,
          todayCaloriesIn:   Math.round(todayCaloriesIn),
          todayCaloriesBurned,
          netCalories,
          todayProtein:      Math.round(todayProtein),
          todayCarbs:        Math.round(todayCarbs),
          todayFat:          Math.round(todayFat),
          currentWeight:     latestProgress?.weight || null,
          tdee,
          macroGoals,
        },
        recentWorkouts,
        latestProgress,
        monthlyCalories,   // consumed only (for chart)
        monthlyBurned,     // burned only (for chart)
        monthlyBalance,    // merged (consumed + burned + net)
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getDashboard };
