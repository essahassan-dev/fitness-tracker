const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  name:        { type: String, required: true },
  description: { type: String, required: true },
  icon:        { type: String, default: 'trophy' },
  category:    { type: String, enum: ['workout', 'nutrition', 'attendance', 'streak', 'milestone'], default: 'workout' },
  earnedAt:    { type: Date, default: Date.now },
}, { _id: false });

const userStatsSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    xp:            { type: Number, default: 0 },
    coins:         { type: Number, default: 0 },
    level:         { type: Number, default: 1 },
    totalXP:       { type: Number, default: 0 }, // all-time XP
    badges:        [badgeSchema],
    // Streaks
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate:{ type: Date, default: null },
    // Totals
    totalWorkouts: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 },
    totalProtein:  { type: Number, default: 0 },
    totalAttendance:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

// XP needed for each level: level^2 * 100
userStatsSchema.methods.xpForNextLevel = function () {
  return this.level * this.level * 100;
};

userStatsSchema.methods.levelProgress = function () {
  const needed = this.xpForNextLevel();
  return Math.min(100, Math.round((this.xp / needed) * 100));
};

module.exports = mongoose.model('UserStats', userStatsSchema);
