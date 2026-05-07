const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getStats, getAllUsers, getUserProfile,
  getUserWorkouts, getUserNutrition, getUserProgress,
  updateUserRole, toggleUserStatus, deleteUser,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/stats',                   getStats);
router.get('/users',                   getAllUsers);
router.get('/users/:id',               getUserProfile);
router.get('/users/:id/workouts',      getUserWorkouts);
router.get('/users/:id/nutrition',     getUserNutrition);
router.get('/users/:id/progress',      getUserProgress);
router.put('/users/:id/role',          updateUserRole);
router.put('/users/:id/status',        toggleUserStatus);
router.delete('/users/:id',            deleteUser);

module.exports = router;
