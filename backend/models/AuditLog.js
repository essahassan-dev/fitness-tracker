const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor is required'],
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      // e.g. 'SUSPEND_BUSINESS', 'CHANGE_PLAN', 'DELETE_BUSINESS',
      //      'APPROVE_REQUEST', 'REVOKE_KEY', 'UPDATE_SETTINGS'
    },
    targetEntity: {
      type: String,
      required: [true, 'Target entity is required'],
      enum: ['Business', 'User', 'Plan', 'Setting', 'Payment'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetName: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    outcome: {
      type: String,
      enum: ['success', 'failure'],
      default: 'failure',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Immutability guard — prevent updates and deletes on existing documents
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
  const err = new Error('AuditLog entries are immutable and cannot be updated.');
  err.status = 403;
  next(err);
});

auditLogSchema.pre(['deleteOne', 'findOneAndDelete', 'deleteMany'], function (next) {
  const err = new Error('AuditLog entries are immutable and cannot be deleted.');
  err.status = 403;
  next(err);
});

// Indexes for common query patterns
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ actionType: 1 });
auditLogSchema.index({ targetEntity: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
