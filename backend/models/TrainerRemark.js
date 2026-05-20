const mongoose = require('mongoose');

const trainerRemarkSchema = new mongoose.Schema(
  {
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type:    { type: String, enum: ['feedback', 'warning', 'encouragement', 'correction'], default: 'feedback' },
    isRead:  { type: Boolean, default: false },
    relatedTo: { type: String, default: '' }, // e.g. workout name or exercise
  },
  { timestamps: true }
);

trainerRemarkSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('TrainerRemark', trainerRemarkSchema);
