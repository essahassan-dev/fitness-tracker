const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAllFees, upsertFee, deleteFee, generateMonthlyFees } = require('../controllers/feeController');

const trainerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'trainer') return next();
  return res.status(403).json({ success: false, message: 'Access denied' });
};

router.use(protect);
router.get('/',          trainerOrAdmin, getAllFees);  // trainers can read
router.post('/',         adminOnly, upsertFee);        // admin only write
router.post('/generate', adminOnly, generateMonthlyFees);
router.delete('/:id',    adminOnly, deleteFee);

module.exports = router;
