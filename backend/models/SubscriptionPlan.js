const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Plan name is required'], trim: true },

    type: {
      type: String,
      enum: ['Monthly', 'Yearly', 'Lifetime', 'Trial', 'Enterprise'],
      required: [true, 'Plan type is required'],
    },

    price:    { type: Number, default: 0 },
    currency: { type: String, default: 'USD', trim: true },

    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly', 'once'],
    },

    maxUsers:       { type: Number, default: null },
    maxTrainers:    { type: Number, default: null },
    storageLimitGB: { type: Number, default: null },

    features: {
      aiEnabled:         { type: Boolean, default: false },
      analyticsEnabled:  { type: Boolean, default: false },
      whiteLabelEnabled: { type: Boolean, default: false },
      customDomain:      { type: Boolean, default: false },
      apiAccess:         { type: Boolean, default: false },
      emailNotifLimit:   { type: Number, default: 0 },
      pushNotifLimit:    { type: Number, default: 0 },
    },

    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
