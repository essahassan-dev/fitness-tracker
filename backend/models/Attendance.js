const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, default: Date.now },
    checkIn:   { type: Date, default: Date.now },
    method:    { type: String, enum: ['qr', 'manual'], default: 'qr' },
    notes:     { type: String, default: '' },
    // QR token used (to prevent duplicate scans on same day)
    qrToken:   { type: String, default: '' },
  },
  { timestamps: true }
);

// One attendance per user per day
attendanceSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
