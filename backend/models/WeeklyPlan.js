const mongoose = require('mongoose');

const exerciseItemSchema = new mongoose.Schema({
  exerciseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', default: null },
  name:         { type: String, required: true },
  category:     { type: String, default: 'strength' },
  sets:         { type: Number, default: 3 },
  reps:         { type: String, default: '10-12' },
  duration:     { type: Number, default: null },
  notes:        { type: String, default: '' },
  completed:    { type: Boolean, default: false },
  completedAt:  { type: Date, default: null },
});

const dayPlanSchema = new mongoose.Schema({
  dayNumber:  { type: Number, required: true }, // 1-7
  dayName:    { type: String, required: true },  // Monday, Tuesday...
  focus:      { type: String, default: '' },     // e.g. "Chest & Triceps"
  isRestDay:  { type: Boolean, default: false },
  exercises:  [exerciseItemSchema],
  completed:  { type: Boolean, default: false },
  completedAt:{ type: Date, default: null },
});

const weeklyPlanSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart:  { type: Date, required: true },
    weekEnd:    { type: Date, required: true },
    goal:       { type: String, default: '' },
    days:       [dayPlanSchema],
    isActive:   { type: Boolean, default: true },
    equipmentType: { type: String, enum: ['MACHINE', 'EQUIPMENT', 'NOTHING'], default: 'MACHINE' },
    generatedFrom: { type: String, default: 'profile' }, // profile | manual
    dietPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan', default: null },
  },
  { timestamps: true }
);

weeklyPlanSchema.index({ user: 1, weekStart: -1 });

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);
