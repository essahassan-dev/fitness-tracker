/**
 * MET-based calorie burn calculator
 * Formula: Calories = MET × weight(kg) × duration(hours)
 * Source: Compendium of Physical Activities
 */

const MET_VALUES = {
  // Cardio
  running:        9.8,
  jogging:        7.0,
  cycling:        7.5,
  swimming:       6.0,
  rowing:         7.0,
  jump_rope:      11.0,
  hiit:           8.0,
  walking:        3.5,
  elliptical:     5.0,
  stairclimber:   9.0,
  // Strength
  strength:       5.0,  // general weight training
  powerlifting:   6.0,
  bodyweight:     4.0,
  // Flexibility / other
  yoga:           2.5,
  pilates:        3.0,
  stretching:     2.3,
  flexibility:    2.5,
  // Sports
  basketball:     8.0,
  football:       8.0,
  soccer:         7.0,
  tennis:         7.3,
  sports:         6.0,
  // Default
  other:          4.0,
  cardio:         7.0,
};

/**
 * Get MET value for an exercise by name or category
 */
const getMET = (name = '', category = 'other') => {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  // Try exact name match first
  for (const [k, v] of Object.entries(MET_VALUES)) {
    if (key.includes(k)) return v;
  }
  // Fall back to category
  return MET_VALUES[category] || MET_VALUES.other;
};

/**
 * Calculate calories burned for a single exercise
 * @param {object} exercise - exercise object
 * @param {number} bodyWeight - user weight in kg (default 70)
 */
const calcExerciseCalories = (exercise, bodyWeight = 70) => {
  const met = getMET(exercise.name, exercise.category);
  let durationHours = 0;

  if (exercise.duration) {
    durationHours = exercise.duration / 60;
  } else if (exercise.sets && exercise.reps) {
    // Estimate duration: ~3 seconds per rep + 60s rest between sets
    const totalReps = exercise.sets * exercise.reps;
    const activeTime = (totalReps * 3) / 60; // minutes
    const restTime = (exercise.sets - 1) * 1; // 1 min rest per set
    durationHours = (activeTime + restTime) / 60;
  }

  return Math.round(met * bodyWeight * durationHours);
};

/**
 * Calculate total calories burned for a workout
 * @param {object} workout - workout document
 * @param {number} bodyWeight - user weight in kg
 */
const calcWorkoutCalories = (workout, bodyWeight = 70) => {
  if (!workout.exercises || workout.exercises.length === 0) {
    // Fallback: use total duration with general MET 5
    if (workout.duration) {
      return Math.round(5.0 * bodyWeight * (workout.duration / 60));
    }
    return 0;
  }

  const fromExercises = workout.exercises.reduce((sum, ex) => {
    return sum + calcExerciseCalories(ex, bodyWeight);
  }, 0);

  // If workout has a total duration and exercises gave 0, use duration fallback
  if (fromExercises === 0 && workout.duration) {
    return Math.round(5.0 * bodyWeight * (workout.duration / 60));
  }

  return fromExercises;
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * Uses Mifflin-St Jeor BMR × activity multiplier
 */
const calcTDEE = (profile) => {
  const { age, height, weight, goal, activityLevel } = profile || {};
  if (!age || !height || !weight) return 2000; // default

  // BMR (assuming male default — can be extended with gender field)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;

  const multipliers = {
    sedentary:   1.2,
    light:       1.375,
    moderate:    1.55,
    active:      1.725,
    very_active: 1.9,
  };

  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));

  // Adjust for goal
  if (goal === 'lose_weight')   return tdee - 500;
  if (goal === 'gain_muscle')   return tdee + 300;
  return tdee;
};

/**
 * Calculate macro goals based on TDEE and goal
 */
const calcMacroGoals = (tdee, goal = '') => {
  let proteinPct, carbsPct, fatPct;

  if (goal === 'gain_muscle') {
    proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25;
  } else if (goal === 'lose_weight') {
    proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30;
  } else {
    proteinPct = 0.25; carbsPct = 0.50; fatPct = 0.25;
  }

  return {
    calories: tdee,
    protein: Math.round((tdee * proteinPct) / 4),  // 4 kcal/g
    carbs:   Math.round((tdee * carbsPct)  / 4),
    fat:     Math.round((tdee * fatPct)    / 9),   // 9 kcal/g
  };
};

module.exports = { calcWorkoutCalories, calcExerciseCalories, calcTDEE, calcMacroGoals, getMET };
