const { getRecommendations, getExercisesByEquipment } = require("../utils/recommendationEngine");
const DietPlan = require("../models/DietPlan");
const User = require("../models/User");

// GET /api/recommendations
const getAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("profile");
    const data = await getRecommendations(user.profile);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/recommendations/exercises?equipmentType=MACHINE
const getExercises = async (req, res, next) => {
  try {
    const { equipmentType = "NOTHING" } = req.query;
    const user = await User.findById(req.user._id).select("profile");
    const exercises = await getExercisesByEquipment(equipmentType, user.profile);
    res.json({ success: true, data: exercises });
  } catch (err) { next(err); }
};

// GET /api/recommendations/diet
const getDiet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("profile");
    const { goal, dietaryPref } = user.profile || {};
    const query = {};
    if (goal) query.goal = { $in: [goal] };
    if (dietaryPref && dietaryPref !== "none") query.dietaryPref = { $in: [dietaryPref, "none"] };
    let plans = await DietPlan.find(query).limit(4);
    if (plans.length === 0) plans = await DietPlan.find().limit(4);
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

module.exports = { getAll, getExercises, getDiet };
