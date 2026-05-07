const express = require('express');
const router = express.Router();
const {
  getProgress,
  createProgress,
  updateProgress,
  deleteProgress,
  getProgressChart,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/chart', getProgressChart);
router.route('/').get(getProgress).post(createProgress);
router.route('/:id').put(updateProgress).delete(deleteProgress);

module.exports = router;
