const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Exercise name is required'], trim: true },
  category: { type: String, enum: ['strength', 'cardio', 'flexibility', 'sports', 'other'], default: 'strength' },
  sets:     { type: Number, default: null },
  reps:     { type: Number, default: null },
  weight:   { type: Number, default: null }, // kg
  duration: { type: Number, default: null }, // minutes
  distance: { type: Number, default: null }, // km
  caloriesBurned: { type: Number, default: 0 },
  notes:    { type: String, default: '', trim: true },
});

const workoutSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:    { type: String, required: [true, 'Workout title is required'], trim: true, maxlength: 100 },
    date:     { type: Date, default: Date.now },
    exercises: [exerciseSchema],
    duration: { type: Number, default: null }, // total minutes
    caloriesBurned: { type: Number, default: 0 }, // total calories burned
    notes:    { type: String, default: '', trim: true },
    mood:     { type: String, enum: ['great', 'good', 'okay', 'tired', 'bad', ''], default: '' },
    completed:{ type: Boolean, default: true },
  },
  { timestamps: true }
);

workoutSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
