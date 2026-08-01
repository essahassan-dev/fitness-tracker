const AttendanceRequest = require('../models/AttendanceRequest');
const Attendance        = require('../models/Attendance');
const { notifyLogin }   = require('../utils/notificationService');
const Notification      = require('../models/Notification');

// ── User: submit manual attendance request ─────────────────────────────────────
const submitRequest = async (req, res, next) => {
  try {
    const { reason, date } = req.body;
    if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Reason is required' });

    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(targetDate); end.setHours(23, 59, 59, 999);

    // Check already marked
    const existing = await Attendance.findOne({ user: req.user._id, date: { $gte: start, $lte: end } });
    if (existing) return res.status(400).json({ success: false, message: 'Attendance already marked for today' });

    // Check duplicate request
    const existingReq = await AttendanceRequest.findOne({ user: req.user._id, date: { $gte: start, $lte: end } });
    if (existingReq) return res.status(400).json({ success: false, message: `Request already submitted (${existingReq.status})` });

    const request = await AttendanceRequest.create({ user: req.user._id, date: targetDate, reason });

    // Notify admin via notification
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'Manual Attendance Request',
        message: `${req.user.name} requested manual attendance: "${reason}"`,
        type: 'warning',
        link: '/admin/attendance',
      });
    }

    res.status(201).json({ success: true, message: 'Request submitted! Admin will review it.', data: request });
  } catch (err) { next(err); }
};

// ── User: get own requests ─────────────────────────────────────────────────────
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await AttendanceRequest.find({ user: req.user._id }).sort('-date').limit(10);
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// ── Admin: get all pending requests ───────────────────────────────────────────
const getAllRequests = async (req, res, next) => {
  try {
    const { status = 'PENDING' } = req.query;
    const query = status === 'all' ? {} : { status };
    const requests = await AttendanceRequest.find(query)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    const pendingCount = await AttendanceRequest.countDocuments({ status: 'PENDING' });
    res.json({ success: true, data: requests, pendingCount });
  } catch (err) { next(err); }
};

// ── Admin: approve request ─────────────────────────────────────────────────────
const approveRequest = async (req, res, next) => {
  try {
    const { adminNote = '' } = req.body;
    const request = await AttendanceRequest.findById(req.params.id).populate('user', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Already processed' });

    // Mark attendance
    await Attendance.create({
      user: request.user._id, date: request.date, checkIn: new Date(), method: 'manual',
      notes: `Remote attendance approved. Reason: ${request.reason}`,
    });

    request.status     = 'APPROVED';
    request.adminNote  = adminNote;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Notify user
    await Notification.create({
      user: request.user._id,
      title: 'Attendance Request Approved!',
      message: `Your manual attendance request has been approved by admin.${adminNote ? ` Note: ${adminNote}` : ''}`,
      type: 'success',
      link: '/attendance',
    });

    res.json({ success: true, message: `Attendance approved for ${request.user.name}`, data: request });
  } catch (err) { next(err); }
};

// ── Admin: reject request ──────────────────────────────────────────────────────
const rejectRequest = async (req, res, next) => {
  try {
    const { adminNote = '' } = req.body;
    const request = await AttendanceRequest.findById(req.params.id).populate('user', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Already processed' });

    request.status     = 'REJECTED';
    request.adminNote  = adminNote;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await Notification.create({
      user: request.user._id,
      title: 'Attendance Request Rejected',
      message: `Your manual attendance request was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
      type: 'warning',
      link: '/attendance',
    });

    res.json({ success: true, message: 'Request rejected', data: request });
  } catch (err) { next(err); }
};

module.exports = { submitRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest };
