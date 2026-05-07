const express = require('express');
const router = express.Router();
const {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutAnalytics,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/analytics', getWorkoutAnalytics);
router.route('/').get(getWorkouts).post(createWorkout);
router.route('/:id').get(getWorkout).put(updateWorkout).delete(deleteWorkout);

module.exports = router;
