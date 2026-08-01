const mongoose = require('mongoose');

const attendanceRequestSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, default: Date.now },
    reason:    { type: String, required: true, trim: true, maxlength: 300 },
    status:    { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    adminNote: { type: String, default: '' },
    reviewedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:{ type: Date, default: null },
  },
  { timestamps: true }
);

attendanceRequestSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('AttendanceRequest', attendanceRequestSchema);
