const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  foods:    [{ name: String, quantity: String, calories: Number, protein: Number, carbs: Number, fat: Number }],
  calories: { type: Number, default: 0 },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },
});

const dietPlanSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  goal:          [{ type: String, enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance'] }],
  dietaryPref:   [{ type: String, enum: ['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'halal'] }],
  calorieRange:  { min: { type: Number, default: 1200 }, max: { type: Number, default: 4000 } },
  bmiRange:      { min: { type: Number, default: 0 }, max: { type: Number, default: 100 } },
  activityLevel: [{ type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] }],
  breakfast:     mealSchema,
  lunch:         mealSchema,
  dinner:        mealSchema,
  snacks:        mealSchema,
  totalCalories: { type: Number, default: 0 },
  totalProtein:  { type: Number, default: 0 },
  totalCarbs:    { type: Number, default: 0 },
  totalFat:      { type: Number, default: 0 },
  tags:          [{ type: String }],
}, { timestamps: true });

// Auto-compute totals
dietPlanSchema.pre('save', function (next) {
  const meals = [this.breakfast, this.lunch, this.dinner, this.snacks].filter(Boolean);
  this.totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
  this.totalProtein  = meals.reduce((s, m) => s + (m.protein  || 0), 0);
  this.totalCarbs    = meals.reduce((s, m) => s + (m.carbs    || 0), 0);
  this.totalFat      = meals.reduce((s, m) => s + (m.fat      || 0), 0);
  next();
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);
