const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getMyUsers, getUserProgress,
  getAllTrainers, createTrainer, assignUser, unassignUser, deleteTrainer,
  sendRemark, getRemarks, getMyRemarks, getUnreadCount,
} = require('../controllers/trainerController');

const trainerOnly = (req, res, next) => {
  if (req.user.role === 'trainer' || req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Trainer access required' });
};

router.use(protect);

// User: get their own remarks from trainer
router.get('/remarks/me',        getMyRemarks);
router.get('/remarks/unread',    getUnreadCount);

// Trainer routes
router.get('/my-users',                    trainerOnly, getMyUsers);
router.get('/my-users/:userId/progress',   trainerOnly, getUserProgress);
router.get('/my-users/:userId/remarks',    trainerOnly, getRemarks);
router.post('/my-users/:userId/remarks',   trainerOnly, sendRemark);

// Admin-only
router.get('/',                adminOnly, getAllTrainers);
router.post('/',               adminOnly, createTrainer);
router.post('/assign',         adminOnly, assignUser);
router.post('/unassign',       adminOnly, unassignUser);
router.delete('/:id',          adminOnly, deleteTrainer);

module.exports = router;
