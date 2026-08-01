const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system
    rule:        { type: String, required: true },   // which rule was broken
    description: { type: String, required: true },   // details
    severity:    { type: String, enum: ['warning', 'severe', 'critical'], default: 'warning' },
    status:      { type: String, enum: ['active', 'resolved', 'dismissed'], default: 'active' },
    resolvedAt:  { type: Date, default: null },
    resolvedNote:{ type: String, default: '' },
  },
  { timestamps: true }
);

violationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Violation', violationSchema);
