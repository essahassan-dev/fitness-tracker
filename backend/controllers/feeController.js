const Fee  = require('../models/Fee');
const User = require('../models/User');

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ── Admin: get all fees ────────────────────────────────────────────────────────
const getAllFees = async (req, res, next) => {
  try {
    const { month = getCurrentMonth(), status } = req.query;
    const query = { month };
    if (status && status !== 'all') query.status = status;

    // Trainers only see their assigned users
    if (req.user.role === 'trainer') {
      const trainer = await User.findById(req.user._id).select('assignedUsers');
      query.user = { $in: trainer.assignedUsers || [] };
    }

    const fees = await Fee.find(query)
      .populate('user', 'name email profile')
      .populate('recordedBy', 'name')
      .sort('-createdAt');

    // Filter out fees where user was deleted
    const validFees = fees.filter((f) => f.user != null);

    let unpaidUsers = [];
    if (req.user.role === 'admin') {
      const paidUserIds = validFees.map((f) => f.user._id.toString());
      unpaidUsers = await User.find({
        role: 'user', isActive: true,
        _id: { $nin: paidUserIds },
      }).select('name email');
    }

    const stats = {
      total:   validFees.length + unpaidUsers.length,
      paid:    validFees.filter((f) => f.status === 'PAID').length,
      unpaid:  validFees.filter((f) => f.status === 'UNPAID').length + unpaidUsers.length,
      partial: validFees.filter((f) => f.status === 'PARTIAL').length,
      totalAmount: validFees.filter((f) => f.status === 'PAID').reduce((s, f) => s + f.amount, 0),
    };

    res.json({ success: true, data: validFees, unpaidUsers, stats, month });
  } catch (err) { next(err); }
};

// ── Admin: add/update fee record ───────────────────────────────────────────────
const upsertFee = async (req, res, next) => {
  try {
    const { userId, amount, month = getCurrentMonth(), status, method, notes, dueDate } = req.body;
    if (!userId || !amount) return res.status(400).json({ success: false, message: 'userId and amount required' });

    const fee = await Fee.findOneAndUpdate(
      { user: userId, month },
      {
        user: userId, amount, month, status: status || 'PAID',
        method: method || 'cash', notes: notes || '',
        dueDate: dueDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        paidDate: status === 'PAID' ? new Date() : null,
        recordedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const populated = await fee.populate('user', 'name email');
    res.json({ success: true, message: 'Fee record saved', data: populated });
  } catch (err) { next(err); }
};

// ── Admin: delete fee record ───────────────────────────────────────────────────
const deleteFee = async (req, res, next) => {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Fee record deleted' });
  } catch (err) { next(err); }
};

// ── Admin: generate fee records for all users ──────────────────────────────────
const generateMonthlyFees = async (req, res, next) => {
  try {
    const { month = getCurrentMonth(), amount = 3000, dueDate } = req.body;
    const users = await User.find({ role: 'user', isActive: true }).select('_id');
    const due   = dueDate ? new Date(dueDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5);

    let created = 0;
    for (const user of users) {
      const exists = await Fee.findOne({ user: user._id, month });
      if (!exists) {
        await Fee.create({ user: user._id, amount, month, status: 'UNPAID', dueDate: due, recordedBy: req.user._id });
        created++;
      }
    }

    res.json({ success: true, message: `Generated ${created} fee records for ${month}` });
  } catch (err) { next(err); }
};

module.exports = { getAllFees, upsertFee, deleteFee, generateMonthlyFees };
