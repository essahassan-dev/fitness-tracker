const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  generateQR, scanQR, getMyAttendance,
  getAllAttendance, getTrainerAttendance,
  manualMark, deleteAttendance,
} = require('../controllers/attendanceController');

const trainerOrAdmin = (req, res, next) => {
  if (req.user.role === 'trainer' || req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Access denied' });
};

router.use(protect);

// User routes
router.get('/qr',           generateQR);
router.post('/scan',        scanQR);
router.get('/my',           getMyAttendance);

// Trainer routes
router.get('/trainer',      trainerOrAdmin, getTrainerAttendance);

// Admin routes
router.get('/',             adminOnly, getAllAttendance);
router.post('/manual',      adminOnly, manualMark);
router.delete('/:id',       adminOnly, deleteAttendance);

module.exports = router;
