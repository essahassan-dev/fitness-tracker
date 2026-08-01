const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getMyStats, getLeaderboard, getAllBadges } = require('../controllers/gamificationController');

router.use(protect);
router.get('/me',          getMyStats);
router.get('/leaderboard', getLeaderboard);
router.get('/badges',      getAllBadges);

module.exports = router;
