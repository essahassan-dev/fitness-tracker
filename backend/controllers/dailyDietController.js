const DailyDietPlan = require('../models/DailyDietPlan');
const DietPlan      = require('../models/DietPlan');
const Nutrition     = require('../models/Nutrition');
const gamification  = require('../utils/gamification');

// ── Get today's diet plan (or start one from a recommended plan) ──────────────
const getTodayPlan = async (req, res, next) => {
  try {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    let plan = await DailyDietPlan.findOne({
      user: req.user._id,
      date: { $gte: today, $lte: todayEnd },
      isActive: true,
    });

    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

// ── Start a diet plan for today from a recommended DietPlan ──────────────────
const startDietPlan = async (req, res, next) => {
  try {
    const { dietPlanId } = req.body;

    const dietPlan = await DietPlan.findById(dietPlanId);
    if (!dietPlan) return res.status(404).json({ success: false, message: 'Diet plan not found' });

    // Deactivate any existing today's plan
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    await DailyDietPlan.updateMany({ user: req.user._id, date: { $gte: today, $lte: todayEnd } }, { isActive: false });

    // Build meals from DietPlan
    const mealKeys = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const meals = mealKeys
      .filter((key) => dietPlan[key])
      .map((key) => ({
        mealType:    key === 'snacks' ? 'snack' : key,
        name:        dietPlan[key].name,
        calories:    dietPlan[key].calories,
        protein:     dietPlan[key].protein,
        carbs:       dietPlan[key].carbs,
        fat:         dietPlan[key].fat,
        foods:       dietPlan[key].foods || [],
        completed:   false,
      }));

    const plan = await DailyDietPlan.create({
      user:       req.user._id,
      dietPlanId,
      planName:   dietPlan.name,
      date:       new Date(),
      meals,
    });

    res.status(201).json({ success: true, message: 'Diet plan started for today!', data: plan });
  } catch (err) { next(err); }
};

// ── Toggle meal complete ──────────────────────────────────────────────────────
const toggleMeal = async (req, res, next) => {
  try {
    const { planId, mealIndex } = req.params;

    const plan = await DailyDietPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const meal = plan.meals[Number(mealIndex)];
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });

    const wasCompleted = meal.completed;
    meal.completed   = !meal.completed;
    meal.completedAt = meal.completed ? new Date() : null;

    plan.markModified('meals');
    await plan.save();

    // Auto-log nutrition when meal is marked complete
    let autoLoggedNutrition = null;
    if (meal.completed && !wasCompleted) {
      autoLoggedNutrition = await autoLogMeal(req.user._id, meal);
    }

    // If unmarked — delete the auto-logged nutrition entry
    if (!meal.completed && wasCompleted) {
      await Nutrition.deleteOne({
        user:   req.user._id,
        source: 'diet_plan',
        'meta.planId':    planId,
        'meta.mealIndex': Number(mealIndex),
      });
    }

    const allDone = plan.meals.every((m) => m.completed);

    res.json({
      success: true,
      data: plan,
      allMealsComplete: allDone,
      autoLoggedNutrition,
    });
  } catch (err) { next(err); }
};

// ── Auto-log a nutrition entry when meal is ticked ────────────────────────────
const autoLogMeal = async (userId, meal, planId, mealIndex) => {
  try {
    const entry = await Nutrition.create({
      user:     userId,
      date:     new Date(),
      mealType: meal.mealType,
      foods:    meal.foods?.length > 0
        ? meal.foods.map((f) => ({
            name:     f.name,
            quantity: 1,
            unit:     f.quantity || 'serving',
            calories: f.calories || 0,
            protein:  f.protein  || 0,
            carbs:    f.carbs    || 0,
            fat:      f.fat      || 0,
          }))
        : [{ name: meal.name, quantity: 1, unit: 'serving', calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }],
      source:   'diet_plan',
      meta:     { planId, mealIndex },
    });

    // Trigger gamification for auto-logged meal
    gamification.onMealLogged(userId, meal.protein || 0).catch(() => {});

    return { calories: meal.calories, protein: meal.protein };
  } catch (err) {
    console.error('Auto-log meal error:', err.message);
    return null;
  }
};

module.exports = { getTodayPlan, startDietPlan, toggleMeal };
