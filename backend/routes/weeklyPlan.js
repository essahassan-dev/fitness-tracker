const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCurrentPlan, regeneratePlan,
  toggleExercise, toggleDay, getPlanHistory,
} = require('../controllers/weeklyPlanController');

router.use(protect);

router.get('/current',                                    getCurrentPlan);
router.post('/regenerate',                                regeneratePlan);
router.get('/history',                                    getPlanHistory);
router.patch('/:planId/day/:dayNumber/toggle',            toggleDay);
router.patch('/:planId/day/:dayNumber/exercise/:exerciseIndex/toggle', toggleExercise);

module.exports = router;
