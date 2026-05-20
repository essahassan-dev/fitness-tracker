const mongoose = require('mongoose');

const upgradeRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    // Payment details (stored safely — no real card processing)
    payment: {
      method:      { type: String, enum: ['card', 'bank_transfer', 'easypaisa', 'jazzcash'], required: true },
      cardHolder:  { type: String, default: '' },
      cardLast4:   { type: String, default: '' },   // only last 4 digits
      bankName:    { type: String, default: '' },
      accountName: { type: String, default: '' },
      transactionId: { type: String, default: '' }, // for bank/mobile payments
    },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

upgradeRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('UpgradeRequest', upgradeRequestSchema);
