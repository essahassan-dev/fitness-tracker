const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount:     { type: Number, required: true },
    month:      { type: String, required: true }, // e.g. "2026-06"
    status:     { type: String, enum: ['PAID', 'UNPAID', 'PARTIAL'], default: 'UNPAID' },
    paidDate:   { type: Date, default: null },
    dueDate:    { type: Date, required: true },
    method:     { type: String, enum: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'other'], default: 'cash' },
    notes:      { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

feeSchema.index({ user: 1, month: 1 });

module.exports = mongoose.model('Fee', feeSchema);
