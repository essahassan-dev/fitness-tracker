const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  category:     { type: String, enum: ['strength', 'cardio', 'hiit', 'flexibility', 'sports', 'home'], required: true },
  difficulty:   { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  goal:         [{ type: String, enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance'] }],
  equipmentType:{ type: String, enum: ['MACHINE', 'EQUIPMENT', 'NOTHING'], required: true },
  duration:     { type: Number, default: 45 },       // minutes
  caloriesBurned:{ type: Number, default: 0 },
  muscleGroups: [{ type: String }],
  exercises:    [{ type: String }],                  // exercise names
  tags:         [{ type: String }],
  gender:       { type: String, enum: ['male', 'female', 'both'], default: 'both' },
  bmiRange:     { min: { type: Number, default: 0 }, max: { type: Number, default: 100 } },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
