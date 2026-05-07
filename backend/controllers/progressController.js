const Progress = require('../models/Progress');

// @desc    Get progress entries
// @route   GET /api/progress
// @access  Private
const getProgress = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await Progress.find(query)
      .sort('-date')
      .limit(Number(limit));

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Create progress entry
// @route   POST /api/progress
// @access  Private
const createProgress = async (req, res, next) => {
  try {
    const entry = await Progress.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, message: 'Progress logged', data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update progress entry
// @route   PUT /api/progress/:id
// @access  Private
const updateProgress = async (req, res, next) => {
  try {
    const entry = await Progress.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, message: 'Progress updated', data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete progress entry
// @route   DELETE /api/progress/:id
// @access  Private
const deleteProgress = async (req, res, next) => {
  try {
    const entry = await Progress.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, message: 'Progress entry deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress chart data
// @route   GET /api/progress/chart
// @access  Private
const getProgressChart = async (req, res, next) => {
  try {
    const { period = '90' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    const entries = await Progress.find({
      user: req.user._id,
      date: { $gte: daysAgo },
    }).sort('date');

    const weightData = entries
      .filter((e) => e.weight)
      .map((e) => ({ date: e.date, value: e.weight }));

    const bodyFatData = entries
      .filter((e) => e.bodyFat)
      .map((e) => ({ date: e.date, value: e.bodyFat }));

    const measurementData = entries
      .filter((e) => e.measurements && Object.values(e.measurements).some((v) => v))
      .map((e) => ({ date: e.date, measurements: e.measurements }));

    res.json({
      success: true,
      data: { weightData, bodyFatData, measurementData, entries },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProgress, createProgress, updateProgress, deleteProgress, getProgressChart };
