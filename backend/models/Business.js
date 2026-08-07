const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema(
  {
    registrationIp: { type: String, default: null },
    lastLoginAt:    { type: Date,   default: null },
    deviceType:     { type: String, default: null },
    country:        { type: String, default: null },
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    adminUser: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'adminUser is required'],
      unique:   true,
    },
    name:    { type: String, trim: true, default: null },
    logoUrl: { type: String, default: null },
    country: { type: String, default: null },
    city:    { type: String, default: null },
    phone:   { type: String, default: null },
    website: { type: String, default: null },

    status: {
      type:    String,
      enum:    ['active', 'suspended', 'trial', 'expired', 'deleted'],
      default: 'active',
    },

    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'SubscriptionPlan',
      default: null,
    },

    subscriptionStart: { type: Date, default: null },
    subscriptionEnd:   { type: Date, default: null },

    isTrial:      { type: Boolean, default: false },
    trialEndDate: { type: Date,    default: null },

    storageUsedMB: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },

    metadata: { type: metadataSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Indexes
businessSchema.index({ status:       1 });
businessSchema.index({ currentPlan:  1 });

module.exports = mongoose.model('Business', businessSchema);
