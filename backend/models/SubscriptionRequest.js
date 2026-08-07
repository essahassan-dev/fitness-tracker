const mongoose = require('mongoose');

const subscriptionRequestSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    requestedPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'info-requested'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    infoMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

subscriptionRequestSchema.index({ business: 1 });
subscriptionRequestSchema.index({ status: 1 });

module.exports = mongoose.model('SubscriptionRequest', subscriptionRequestSchema);
