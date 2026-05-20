const express = require('express');
const router = express.Router();
const {
  getNutrition,
  getDailySummary,
  createNutrition,
  updateNutrition,
  deleteNutrition,
  getNutritionAnalytics,
} = require('../controllers/nutritionController');
const { protect, premiumOnly } = require('../middleware/auth');

router.use(protect);

router.get('/daily',     getDailySummary);
router.get('/analytics', premiumOnly, getNutritionAnalytics);  // premium
router.route('/').get(getNutrition).post(createNutrition);
router.route('/:id').put(updateNutrition).delete(deleteNutrition);

module.exports = router;
