const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
  },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'serving', trim: true },
  calories: { type: Number, required: true, default: 0 },
  protein: { type: Number, default: 0 }, // grams
  carbs: { type: Number, default: 0 },   // grams
  fat: { type: Number, default: 0 },     // grams
  fiber: { type: Number, default: 0 },   // grams
});

const nutritionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'Meal type is required'],
    },
    foods: [foodItemSchema],
    notes: { type: String, default: '', trim: true },
    source: { type: String, enum: ['manual', 'diet_plan'], default: 'manual' },
    meta: { planId: { type: String, default: '' }, mealIndex: { type: Number, default: null } },
    // Computed totals (denormalized for performance)
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-compute totals before saving
nutritionSchema.pre('save', function (next) {
  this.totalCalories = this.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  this.totalProtein = this.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
  this.totalCarbs = this.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  this.totalFat = this.foods.reduce((sum, f) => sum + (f.fat || 0), 0);
  next();
});

nutritionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Nutrition', nutritionSchema);
