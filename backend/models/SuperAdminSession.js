const mongoose = require('mongoose');

const superAdminSessionSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jti:        { type: String, required: true, unique: true }, // JWT ID claim
    device:     { type: String },
    browser:    { type: String },
    ipAddress:  { type: String },
    lastSeenAt: { type: Date },
    expiresAt:  { type: Date },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

superAdminSessionSchema.index({ user: 1 });
superAdminSessionSchema.index({ isActive: 1 });

module.exports = mongoose.model('SuperAdminSession', superAdminSessionSchema);
