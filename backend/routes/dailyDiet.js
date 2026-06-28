const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getTodayPlan, startDietPlan, toggleMeal } = require('../controllers/dailyDietController');

router.use(protect);
router.get('/today',                        getTodayPlan);
router.post('/start',                       startDietPlan);
router.patch('/:planId/meal/:mealIndex/toggle', toggleMeal);

module.exports = router;
