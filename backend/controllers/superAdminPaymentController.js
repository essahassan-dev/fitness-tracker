const Payment       = require('../models/Payment');
const Business      = require('../models/Business');
const { withAudit } = require('../utils/withAudit');

// ── List payments ──────────────────────────────────────────────────────────────
const listPayments = async (req, res, next) => {
  try {
    const { status = 'all', businessId, from, to, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status !== 'all') query.status = status;
    if (businessId) query.business = businessId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('business', 'name logoUrl')
      .populate('plan', 'name type')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Revenue aggregations
    const [totalRevenue, monthlyRevenue, yearlyRevenue] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: new Date(new Date().setDate(1)) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
      summary: {
        totalRevenue:   totalRevenue[0]?.total   || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        yearlyRevenue:  yearlyRevenue[0]?.total  || 0,
        pendingCount:   await Payment.countDocuments({ status: 'pending' }),
        completedCount: await Payment.countDocuments({ status: 'completed' }),
        failedCount:    await Payment.countDocuments({ status: 'failed' }),
      },
    });
  } catch (err) { next(err); }
};

// ── Refund payment ─────────────────────────────────────────────────────────────
const refundPayment = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const payment = await Payment.findById(req.params.id).populate('business', 'name');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'completed') return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });

    await withAudit(req, 'REFUND_PAYMENT', 'Payment', payment._id, async () => {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      payment.refundReason = reason;
      return payment.save();
    }, { targetName: `Payment for ${payment.business?.name}`, description: `Refunded $${payment.amount}. Reason: ${reason}` });

    res.json({ success: true, message: 'Payment refunded', data: payment });
  } catch (err) { next(err); }
};

// ── Export payments (CSV) ──────────────────────────────────────────────────────
const exportPayments = async (req, res, next) => {
  try {
    const { status = 'all', from, to, format = 'csv' } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to);
    }

    const payments = await Payment.find(query)
      .populate('business', 'name')
      .populate('plan', 'name type')
      .sort('-createdAt')
      .lean();

    const rows = payments.map(p => ({
      Business:      p.business?.name || '',
      Amount:        p.amount,
      Currency:      p.currency,
      Plan:          p.plan?.name || '',
      Status:        p.status,
      Method:        p.paymentMethod || '',
      TransactionID: p.transactionId || '',
      Date:          p.createdAt?.toISOString().split('T')[0] || '',
      RefundedAt:    p.refundedAt?.toISOString().split('T')[0] || '',
    }));

    if (format === 'csv') {
      const header = Object.keys(rows[0] || {}).join(',');
      const lines  = rows.map(r => Object.values(r).map(v => `"${v}"`).join(','));
      const csv    = [header, ...lines].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = { listPayments, refundPayment, exportPayments };
