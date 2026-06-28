const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  mealType:    { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  name:        { type: String, required: true },
  calories:    { type: Number, default: 0 },
  protein:     { type: Number, default: 0 },
  carbs:       { type: Number, default: 0 },
  fat:         { type: Number, default: 0 },
  foods:       [{ name: String, quantity: String, calories: Number, protein: Number, carbs: Number, fat: Number }],
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const dailyDietPlanSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dietPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan', default: null },
    planName:   { type: String, default: '' },
    date:       { type: Date, default: Date.now },
    meals:      [mealItemSchema],
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

dailyDietPlanSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DailyDietPlan', dailyDietPlanSchema);
