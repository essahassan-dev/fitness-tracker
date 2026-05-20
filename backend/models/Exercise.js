const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  category:      { type: String, enum: ['strength', 'cardio', 'flexibility', 'sports', 'other'], required: true },
  equipmentType: { type: String, enum: ['MACHINE', 'EQUIPMENT', 'NOTHING'], required: true },
  equipment:     [{ type: String }],                 // e.g. ['barbell', 'bench']
  muscleGroup:   { type: String, required: true },   // primary muscle
  secondaryMuscles: [{ type: String }],
  difficulty:    { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  goal:          [{ type: String, enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance'] }],
  met:           { type: Number, default: 5.0 },
  instructions:  [{ type: String }],
  tips:          [{ type: String }],
  sets:          { type: Number, default: 3 },
  reps:          { type: String, default: '8-12' },
  restSeconds:   { type: Number, default: 60 },
}, { timestamps: true });

module.exports = mongoose.model('Exercise', exerciseSchema);
