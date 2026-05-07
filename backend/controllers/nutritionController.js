const Nutrition = require('../models/Nutrition');

// @desc    Get nutrition entries
// @route   GET /api/nutrition
// @access  Private
const getNutrition = async (req, res, next) => {
  try {
    const { date, startDate, endDate, mealType, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (mealType && mealType !== 'all') {
      query.mealType = mealType;
    }

    const total = await Nutrition.countDocuments(query);
    const entries = await Nutrition.find(query)
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: entries,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily nutrition summary
// @route   GET /api/nutrition/daily
// @access  Private
const getDailySummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const entries = await Nutrition.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    });

    const summary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
    };

    entries.forEach((entry) => {
      summary.totalCalories += entry.totalCalories;
      summary.totalProtein += entry.totalProtein;
      summary.totalCarbs += entry.totalCarbs;
      summary.totalFat += entry.totalFat;
      summary.meals[entry.mealType].push(entry);
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Create nutrition entry
// @route   POST /api/nutrition
// @access  Private
const createNutrition = async (req, res, next) => {
  try {
    const entry = await Nutrition.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, message: 'Meal logged successfully', data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update nutrition entry
// @route   PUT /api/nutrition/:id
// @access  Private
const updateNutrition = async (req, res, next) => {
  try {
    const entry = await Nutrition.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, message: 'Meal updated', data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete nutrition entry
// @route   DELETE /api/nutrition/:id
// @access  Private
const deleteNutrition = async (req, res, next) => {
  try {
    const entry = await Nutrition.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nutrition analytics
// @route   GET /api/nutrition/analytics
// @access  Private
const getNutritionAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    const dailyCalories = await Nutrition.aggregate([
      { $match: { user: req.user._id, date: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          calories: { $sum: '$totalCalories' },
          protein: { $sum: '$totalProtein' },
          carbs: { $sum: '$totalCarbs' },
          fat: { $sum: '$totalFat' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const mealTypeBreakdown = await Nutrition.aggregate([
      { $match: { user: req.user._id, date: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$mealType',
          avgCalories: { $avg: '$totalCalories' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: { dailyCalories, mealTypeBreakdown } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNutrition, getDailySummary, createNutrition, updateNutrition, deleteNutrition, getNutritionAnalytics };
