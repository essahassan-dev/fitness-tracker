const User          = require('../models/User');
const Workout       = require('../models/Workout');
const Progress      = require('../models/Progress');
const Nutrition     = require('../models/Nutrition');
const TrainerRemark = require('../models/TrainerRemark');

// ── Trainer: get their assigned users ─────────────────────────────────────────
const getMyUsers = async (req, res, next) => {
  try {
    const trainer = await User.findById(req.user._id).populate('assignedUsers', 'name email profile isActive createdAt subscription');
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    // Enrich with latest progress
    const enriched = await Promise.all(
      trainer.assignedUsers.map(async (u) => {
        const [latestProgress, workoutCount, lastWorkout] = await Promise.all([
          Progress.findOne({ user: u._id }).sort('-date').select('weight bodyFat date'),
          Workout.countDocuments({ user: u._id }),
          Workout.findOne({ user: u._id }).sort('-date').select('title date caloriesBurned'),
        ]);
        return { ...u.toObject(), latestProgress, workoutCount, lastWorkout };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

// ── Trainer: get one user's full progress ─────────────────────────────────────
const getUserProgress = async (req, res, next) => {
  try {
    const trainer = await User.findById(req.user._id);
    const isAssigned = trainer.assignedUsers.some((id) => id.toString() === req.params.userId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'This user is not assigned to you' });

    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [progressEntries, recentWorkouts, workoutCount, weightHistory] = await Promise.all([
      Progress.find({ user: user._id }).sort('-date').limit(20),
      Workout.find({ user: user._id }).sort('-date').limit(10),
      Workout.countDocuments({ user: user._id }),
      Progress.find({ user: user._id, weight: { $ne: null } }).sort('date').select('weight date'),
    ]);

    res.json({
      success: true,
      data: { user, progressEntries, recentWorkouts, workoutCount, weightHistory },
    });
  } catch (err) { next(err); }
};

// ── Admin: get all trainers ────────────────────────────────────────────────────
const getAllTrainers = async (req, res, next) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('-password')
      .populate('assignedUsers', 'name email');
    res.json({ success: true, data: trainers });
  } catch (err) { next(err); }
};

// ── Admin: create trainer account ─────────────────────────────────────────────
const createTrainer = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const trainer = await User.create({ name, email, password, role: 'trainer' });
    res.status(201).json({
      success: true,
      message: 'Trainer account created',
      data: { _id: trainer._id, name: trainer.name, email: trainer.email, role: trainer.role },
    });
  } catch (err) { next(err); }
};

// ── Admin: assign user to trainer ─────────────────────────────────────────────
const assignUser = async (req, res, next) => {
  try {
    const { trainerId, userId } = req.body;

    const trainer = await User.findOne({ _id: trainerId, role: 'trainer' });
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Add to trainer's list if not already there
    if (!trainer.assignedUsers.includes(userId)) {
      trainer.assignedUsers.push(userId);
      await trainer.save({ validateBeforeSave: false });
    }

    // Set trainer on user
    user.assignedTrainer = trainerId;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `${user.name} assigned to ${trainer.name}` });
  } catch (err) { next(err); }
};

// ── Admin: unassign user from trainer ─────────────────────────────────────────
const unassignUser = async (req, res, next) => {
  try {
    const { trainerId, userId } = req.body;

    await User.findByIdAndUpdate(trainerId, { $pull: { assignedUsers: userId } });
    await User.findByIdAndUpdate(userId, { assignedTrainer: null });

    res.json({ success: true, message: 'User unassigned from trainer' });
  } catch (err) { next(err); }
};

// ── Admin: delete trainer ──────────────────────────────────────────────────────
const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await User.findOne({ _id: req.params.id, role: 'trainer' });
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    // Unassign all users
    await User.updateMany({ assignedTrainer: trainer._id }, { assignedTrainer: null });
    await User.findByIdAndDelete(trainer._id);

    res.json({ success: true, message: 'Trainer deleted' });
  } catch (err) { next(err); }
};

// ── Trainer: send remark to user ──────────────────────────────────────────────
const sendRemark = async (req, res, next) => {
  try {
    const trainer = await User.findById(req.user._id);
    const isAssigned = trainer.assignedUsers.some((id) => id.toString() === req.params.userId);
    if (!isAssigned) return res.status(403).json({ success: false, message: 'User not assigned to you' });

    const { message, type, relatedTo } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    const remark = await TrainerRemark.create({
      trainer: req.user._id,
      user: req.params.userId,
      message, type: type || 'feedback', relatedTo: relatedTo || '',
    });

    const populated = await remark.populate('trainer', 'name');
    res.status(201).json({ success: true, message: 'Remark sent!', data: populated });
  } catch (err) { next(err); }
};

// ── Trainer: get remarks for a user ───────────────────────────────────────────
const getRemarks = async (req, res, next) => {
  try {
    const remarks = await TrainerRemark.find({ user: req.params.userId })
      .populate('trainer', 'name')
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, data: remarks });
  } catch (err) { next(err); }
};

// ── User: get their own remarks (notifications) ────────────────────────────────
const getMyRemarks = async (req, res, next) => {
  try {
    const remarks = await TrainerRemark.find({ user: req.user._id })
      .populate('trainer', 'name')
      .sort('-createdAt')
      .limit(20);

    // Mark all as read
    await TrainerRemark.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    res.json({ success: true, data: remarks });
  } catch (err) { next(err); }
};

// ── User: get unread count ─────────────────────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await TrainerRemark.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

module.exports = {
  getMyUsers, getUserProgress,
  getAllTrainers, createTrainer, assignUser, unassignUser, deleteTrainer,
  sendRemark, getRemarks, getMyRemarks, getUnreadCount,
};
