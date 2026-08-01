const UserStats = require('../models/UserStats');

// ── XP values ──────────────────────────────────────────────────────────────────
const XP = {
  WORKOUT_LOGGED:    50,
  MEAL_LOGGED:       20,
  ATTENDANCE:        30,
  WEEKLY_PLAN_DAY:   40,
  PROGRESS_LOGGED:   25,
  STREAK_BONUS:      (streak) => streak * 10,  // 10 XP per streak day
};

const COINS = {
  WORKOUT_LOGGED:    10,
  MEAL_LOGGED:        5,
  ATTENDANCE:         8,
  WEEKLY_PLAN_DAY:   12,
  BADGE_EARNED:      50,
};

// ── All available badges ───────────────────────────────────────────────────────
const BADGES = {
  // Workout badges
  FIRST_WORKOUT:   { id: 'first_workout',   name: 'First Step',       description: 'Logged your first workout',          icon: 'dumbbell',   category: 'workout' },
  WORKOUT_10:      { id: 'workout_10',      name: 'Getting Serious',  description: 'Logged 10 workouts',                 icon: 'fire',       category: 'workout' },
  WORKOUT_50:      { id: 'workout_50',      name: 'Dedicated',        description: 'Logged 50 workouts',                 icon: 'medal',      category: 'workout' },
  WORKOUT_100:     { id: 'workout_100',     name: '100 Workouts',     description: 'Completed 100 workouts',             icon: 'trophy',     category: 'milestone' },
  CALORIE_BURNER:  { id: 'calorie_burner',  name: 'Calorie Burner',   description: 'Burned 10,000 calories total',       icon: 'flame',      category: 'workout' },
  FAT_DESTROYER:   { id: 'fat_destroyer',   name: 'Fat Destroyer',    description: 'Burned 50,000 calories total',       icon: 'lightning',  category: 'workout' },
  // Nutrition badges
  FIRST_MEAL:      { id: 'first_meal',      name: 'Eating Clean',     description: 'Logged your first meal',             icon: 'apple',      category: 'nutrition' },
  PROTEIN_KING:    { id: 'protein_king',    name: 'Protein King',     description: 'Hit protein goal 7 days in a row',   icon: 'crown',      category: 'nutrition' },
  NUTRITION_30:    { id: 'nutrition_30',    name: 'Nutrition Master', description: 'Logged meals for 30 days',           icon: 'leaf',       category: 'nutrition' },
  // Streak badges
  STREAK_3:        { id: 'streak_3',        name: '3 Day Streak',     description: 'Active 3 days in a row',             icon: 'streak',     category: 'streak' },
  STREAK_7:        { id: 'streak_7',        name: '7 Day Streak',     description: 'Active 7 days in a row',             icon: 'fire',       category: 'streak' },
  STREAK_30:       { id: 'streak_30',       name: 'Unstoppable',      description: 'Active 30 days in a row',            icon: 'star',       category: 'streak' },
  // Attendance badges
  ATTENDANCE_10:   { id: 'attendance_10',   name: 'Regular',          description: 'Attended gym 10 times',              icon: 'check',      category: 'attendance' },
  ATTENDANCE_50:   { id: 'attendance_50',   name: 'Gym Rat',          description: 'Attended gym 50 times',              icon: 'building',   category: 'attendance' },
  // Level badges
  LEVEL_5:         { id: 'level_5',         name: 'Rising Star',      description: 'Reached Level 5',                    icon: 'star',       category: 'milestone' },
  LEVEL_10:        { id: 'level_10',        name: 'FitStack Pro',     description: 'Reached Level 10',                   icon: 'diamond',    category: 'milestone' },
};

// ── Get or create user stats ───────────────────────────────────────────────────
const getOrCreate = async (userId) => {
  let stats = await UserStats.findOne({ user: userId });
  if (!stats) stats = await UserStats.create({ user: userId });
  return stats;
};

// ── Award XP + coins ───────────────────────────────────────────────────────────
const award = async (userId, xpAmount, coinsAmount, reason) => {
  try {
    const stats = await getOrCreate(userId);
    stats.xp      += xpAmount;
    stats.totalXP += xpAmount;
    stats.coins   += coinsAmount;

    // Level up check
    while (stats.xp >= stats.level * stats.level * 100) {
      stats.xp -= stats.level * stats.level * 100;
      stats.level += 1;
      console.log(`User ${userId} leveled up to ${stats.level}!`);
    }

    await stats.save();
    return stats;
  } catch (err) {
    console.error('Gamification award error:', err.message);
  }
};

// ── Check and award badges ─────────────────────────────────────────────────────
const checkBadges = async (userId) => {
  try {
    const stats = await getOrCreate(userId);
    const earned = stats.badges.map((b) => b.id);
    const newBadges = [];

    const check = (condition, badge) => {
      if (condition && !earned.includes(badge.id)) {
        stats.badges.push({ ...badge, earnedAt: new Date() });
        newBadges.push(badge);
        stats.coins += COINS.BADGE_EARNED;
      }
    };

    check(stats.totalWorkouts >= 1,       BADGES.FIRST_WORKOUT);
    check(stats.totalWorkouts >= 10,      BADGES.WORKOUT_10);
    check(stats.totalWorkouts >= 50,      BADGES.WORKOUT_50);
    check(stats.totalWorkouts >= 100,     BADGES.WORKOUT_100);
    check(stats.totalCaloriesBurned >= 10000, BADGES.CALORIE_BURNER);
    check(stats.totalCaloriesBurned >= 50000, BADGES.FAT_DESTROYER);
    check(stats.currentStreak >= 3,       BADGES.STREAK_3);
    check(stats.currentStreak >= 7,       BADGES.STREAK_7);
    check(stats.currentStreak >= 30,      BADGES.STREAK_30);
    check(stats.totalAttendance >= 10,    BADGES.ATTENDANCE_10);
    check(stats.totalAttendance >= 50,    BADGES.ATTENDANCE_50);
    check(stats.level >= 5,              BADGES.LEVEL_5);
    check(stats.level >= 10,             BADGES.LEVEL_10);

    if (newBadges.length > 0) await stats.save();
    return { stats, newBadges };
  } catch (err) {
    console.error('Badge check error:', err.message);
    return { stats: null, newBadges: [] };
  }
};

// ── Update streak ──────────────────────────────────────────────────────────────
const updateStreak = async (userId) => {
  try {
    const stats = await getOrCreate(userId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last  = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;

    if (last) {
      const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        stats.currentStreak += 1;
      } else if (diff > 1) {
        stats.currentStreak = 1; // streak broken
      }
      // diff === 0 means same day, no change
    } else {
      stats.currentStreak = 1;
    }

    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }

    stats.lastActiveDate = today;
    await stats.save();
    return stats;
  } catch (err) {
    console.error('Streak update error:', err.message);
  }
};

// ── Event handlers ─────────────────────────────────────────────────────────────
const onWorkoutLogged = async (userId, caloriesBurned = 0) => {
  const stats = await getOrCreate(userId);
  stats.totalWorkouts      += 1;
  stats.totalCaloriesBurned += caloriesBurned;
  await stats.save();
  await updateStreak(userId);
  await award(userId, XP.WORKOUT_LOGGED, COINS.WORKOUT_LOGGED, 'workout_logged');
  const { newBadges } = await checkBadges(userId);
  return newBadges;
};

const onMealLogged = async (userId, protein = 0) => {
  const stats = await getOrCreate(userId);
  stats.totalProtein += protein;
  await stats.save();
  await updateStreak(userId);
  await award(userId, XP.MEAL_LOGGED, COINS.MEAL_LOGGED, 'meal_logged');
  await checkBadges(userId);
};

const onAttendance = async (userId) => {
  const stats = await getOrCreate(userId);
  stats.totalAttendance += 1;
  await stats.save();
  await updateStreak(userId);
  await award(userId, XP.ATTENDANCE, COINS.ATTENDANCE, 'attendance');
  const { newBadges } = await checkBadges(userId);
  return newBadges;
};

const onProgressLogged = async (userId) => {
  await updateStreak(userId);
  await award(userId, XP.PROGRESS_LOGGED, 0, 'progress_logged');
};

module.exports = {
  getOrCreate, award, checkBadges, updateStreak,
  onWorkoutLogged, onMealLogged, onAttendance, onProgressLogged,
  XP, COINS, BADGES,
};
