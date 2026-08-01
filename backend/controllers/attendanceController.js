const Attendance = require('../models/Attendance');
const User       = require('../models/User');
const jwt        = require('jsonwebtoken');
const QRCode     = require('qrcode');

// ── Generate QR code for user ─────────────────────────────────────────────────
// QR contains a signed JWT token with userId + today's date
const generateQR = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Create a short-lived token (valid 10 minutes)
    const qrToken = jwt.sign(
      { userId: req.user._id, date: today, type: 'attendance' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Generate QR code as base64 image
    const qrImage = await QRCode.toDataURL(qrToken, {
      width: 300,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    // Check if already marked today
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const existing   = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({
      success: true,
      data: {
        qrImage,
        qrToken,
        alreadyMarked: !!existing,
        markedAt: existing?.checkIn || null,
        expiresIn: 600, // 10 minutes in seconds
      },
    });
  } catch (err) { next(err); }
};

// ── Scan QR and mark attendance ───────────────────────────────────────────────
const scanQR = async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ success: false, message: 'QR token required' });

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'QR code expired or invalid. Generate a new one.' });
    }

    if (decoded.type !== 'attendance') {
      return res.status(400).json({ success: false, message: 'Invalid QR code' });
    }

    const userId = decoded.userId;
    const user   = await User.findById(userId).select('name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check duplicate attendance today
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const existing   = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for ${user.name} today at ${new Date(existing.checkIn).toLocaleTimeString()}`,
      });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      user:    userId,
      date:    new Date(),
      checkIn: new Date(),
      method:  'qr',
      qrToken,
    });

    // Gamification
    require('../utils/gamification').onAttendance(userId).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Attendance marked for ${user.name}!`,
      data: { ...attendance.toObject(), user: { name: user.name, email: user.email } },
    });
  } catch (err) { next(err); }
};

// ── User: get own attendance history ─────────────────────────────────────────
const getMyAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const query = { user: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      query.date  = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query).sort('-date').limit(60);
    const total   = await Attendance.countDocuments({ user: req.user._id });

    // This month count
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth  = await Attendance.countDocuments({ user: req.user._id, date: { $gte: monthStart } });

    res.json({ success: true, data: records, total, thisMonth });
  } catch (err) { next(err); }
};

// ── Admin: get all attendance ─────────────────────────────────────────────────
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, userId, page = 1, limit = 30 } = req.query;
    const query = {};

    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      query.date  = { $gte: start, $lte: end };
    }
    if (userId) query.user = userId;

    const total   = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('user', 'name email profile')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Today's count
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = await Attendance.countDocuments({ date: { $gte: todayStart } });

    res.json({ success: true, data: records, total, todayCount, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Trainer: get attendance of assigned users ─────────────────────────────────
const getTrainerAttendance = async (req, res, next) => {
  try {
    const trainer = await User.findById(req.user._id).select('assignedUsers');
    if (!trainer.assignedUsers?.length) {
      return res.json({ success: true, data: [], total: 0, todayCount: 0 });
    }

    const { date } = req.query;
    const query    = { user: { $in: trainer.assignedUsers } };

    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      query.date  = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate('user', 'name email')
      .sort('-date')
      .limit(50);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = await Attendance.countDocuments({
      user: { $in: trainer.assignedUsers },
      date: { $gte: todayStart },
    });

    res.json({ success: true, data: records, total: records.length, todayCount });
  } catch (err) { next(err); }
};

// ── Admin: manual mark attendance ─────────────────────────────────────────────
const manualMark = async (req, res, next) => {
  try {
    const { userId, date, notes } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(targetDate); end.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({ user: userId, date: { $gte: start, $lte: end } });
    if (existing) return res.status(400).json({ success: false, message: 'Attendance already marked for this day' });

    const attendance = await Attendance.create({ user: userId, date: targetDate, checkIn: targetDate, method: 'manual', notes: notes || '' });
    const populated  = await attendance.populate('user', 'name email');

    res.status(201).json({ success: true, message: 'Attendance marked manually', data: populated });
  } catch (err) { next(err); }
};

// ── Admin: delete attendance record ───────────────────────────────────────────
const deleteAttendance = async (req, res, next) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) { next(err); }
};

module.exports = { generateQR, scanQR, getMyAttendance, getAllAttendance, getTrainerAttendance, manualMark, deleteAttendance };
