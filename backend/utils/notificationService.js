const Notification = require('../models/Notification');

const MOTIVATIONAL = [
  "Keep going — every rep counts!",
  "You're one workout away from a great mood.",
  "Consistency beats perfection every time.",
  "Small progress is still progress!",
  "Your future self will thank you.",
  "The only bad workout is the one that didn't happen.",
  "Push through. You've got this!",
  "Champions are made in the moments when they want to quit.",
];

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const create = async (userId, title, message, type = 'info', link = '') => {
  try {
    await Notification.create({ user: userId, title, message, type, link });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Login notification
const notifyLogin = (userId, name) =>
  create(userId, `Welcome back, ${name}!`, "You're logged in. Ready to crush today's goals?", 'success', '/dashboard');

// Workout logged
const notifyWorkoutLogged = (userId, workoutTitle, caloriesBurned) =>
  create(userId, 'Workout Logged!', `"${workoutTitle}" done${caloriesBurned ? ` — ${caloriesBurned} kcal burned` : ''}. ${random(MOTIVATIONAL)}`, 'success', '/workouts');

// Meal logged
const notifyMealLogged = (userId, mealType, calories) =>
  create(userId, 'Meal Logged!', `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${calories} kcal) logged. Keep tracking!`, 'info', '/nutrition');

// Weekly plan day complete
const notifyDayComplete = (userId, dayName, focus) =>
  create(userId, `${dayName} Complete!`, `You finished your ${focus} workout. ${random(MOTIVATIONAL)}`, 'success', '/weekly-plan');

// Motivation — workout not done yet (called by cron)
const notifyWorkoutReminder = (userId) =>
  create(userId, "Time to Train!", `You haven't logged a workout today. ${random(MOTIVATIONAL)}`, 'motivation', '/workouts');

// Motivation — calories low
const notifyNutritionReminder = (userId) =>
  create(userId, "Don't Forget to Eat!", "You haven't logged any meals today. Nutrition is 70% of your results!", 'warning', '/nutrition');

// Progress milestone
const notifyProgressMilestone = (userId, message) =>
  create(userId, 'Milestone Reached!', message, 'success', '/progress');

module.exports = {
  notifyLogin, notifyWorkoutLogged, notifyMealLogged,
  notifyDayComplete, notifyWorkoutReminder, notifyNutritionReminder,
  notifyProgressMilestone,
};
