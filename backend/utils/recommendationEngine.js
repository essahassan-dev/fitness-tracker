const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise");
const DietPlan = require("../models/DietPlan");
const { calcTDEE, calcMacroGoals } = require("./calorieCalc");

const calcBMI = (weight, height) => {
  if (!weight || !height) return null;
  return parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
};

const getBMICategory = (bmi) => {
  if (!bmi) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25)   return "normal";
  if (bmi < 30)   return "overweight";
  return "obese";
};

const getFitnessCategory = (bmi, goal, experienceLevel) => {
  if (!bmi) return "general";
  if (bmi >= 30) return "weight_loss_priority";
  if (bmi >= 25) return "fat_loss";
  if (bmi < 18.5) return "muscle_gain_priority";
  if (goal === "gain_muscle") return "muscle_gain";
  if (goal === "lose_weight") return "fat_loss";
  if (goal === "improve_endurance") return "endurance";
  return "maintenance";
};

const getRecommendations = async (profile) => {
  const { age, height, weight, gender, goal, activityLevel, experienceLevel, dietaryPref } = profile || {};

  const bmi = calcBMI(weight, height);
  const bmiCategory = getBMICategory(bmi);
  const fitnessCategory = getFitnessCategory(bmi, goal, experienceLevel);
  const tdee = calcTDEE(profile);
  const macroGoals = calcMacroGoals(tdee, goal);

  // Build workout plan query
  const wpQuery = {};
  if (goal) wpQuery.goal = { $in: [goal] };
  if (experienceLevel) wpQuery.difficulty = experienceLevel;
  else if (bmi && bmi >= 30) wpQuery.difficulty = { $in: ["beginner", "intermediate"] };

  // Build exercise query (get 3 per equipment type)
  const exQuery = {};
  if (goal) exQuery.goal = { $in: [goal] };
  if (experienceLevel) exQuery.difficulty = experienceLevel;
  else exQuery.difficulty = { $in: ["beginner", "intermediate"] };

  // Build diet plan query
  const dpQuery = {};
  if (goal) dpQuery.goal = { $in: [goal] };
  if (dietaryPref && dietaryPref !== "none") dpQuery.dietaryPref = { $in: [dietaryPref, "none"] };
  if (tdee) {
    dpQuery["calorieRange.min"] = { $lte: tdee };
    dpQuery["calorieRange.max"] = { $gte: tdee * 0.7 };
  }

  const [allWorkoutPlans, machineExercises, equipmentExercises, nothingExercises, dietPlans] = await Promise.all([
    WorkoutPlan.find(wpQuery).limit(6),
    Exercise.find({ ...exQuery, equipmentType: "MACHINE" }).limit(5),
    Exercise.find({ ...exQuery, equipmentType: "EQUIPMENT" }).limit(5),
    Exercise.find({ ...exQuery, equipmentType: "NOTHING" }).limit(5),
    DietPlan.find(dpQuery).limit(3),
  ]);

  // Fallback if no results
  const workoutPlans = allWorkoutPlans.length > 0 ? allWorkoutPlans : await WorkoutPlan.find().limit(4);
  const diets = dietPlans.length > 0 ? dietPlans : await DietPlan.find().limit(3);

  // Equipment suggestion based on BMI and goal
  let equipmentSuggestion = "NOTHING";
  if (bmi && bmi < 30 && experienceLevel !== "beginner") equipmentSuggestion = "EQUIPMENT";
  if (experienceLevel === "intermediate" || experienceLevel === "advanced") equipmentSuggestion = "MACHINE";

  return {
    bmi,
    bmiCategory,
    fitnessCategory,
    tdee,
    macroGoals,
    equipmentSuggestion,
    workoutPlans,
    exercises: { MACHINE: machineExercises, EQUIPMENT: equipmentExercises, NOTHING: nothingExercises },
    dietPlans: diets,
  };
};

const getExercisesByEquipment = async (equipmentType, profile) => {
  const { goal, experienceLevel } = profile || {};
  const query = { equipmentType };
  if (goal) query.goal = { $in: [goal] };
  if (experienceLevel) query.difficulty = experienceLevel;
  const exercises = await Exercise.find(query).limit(10);
  if (exercises.length === 0) return Exercise.find({ equipmentType }).limit(10);
  return exercises;
};

module.exports = { getRecommendations, getExercisesByEquipment, calcBMI, getBMICategory };
