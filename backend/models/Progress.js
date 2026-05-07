const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
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
    weight: { type: Number, default: null }, // kg
    bodyFat: { type: Number, default: null }, // percentage
    measurements: {
      chest: { type: Number, default: null },   // cm
      waist: { type: Number, default: null },
      hips: { type: Number, default: null },
      biceps: { type: Number, default: null },
      thighs: { type: Number, default: null },
    },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
