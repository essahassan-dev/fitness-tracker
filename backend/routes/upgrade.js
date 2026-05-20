const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  submitRequest, getMyRequest,
  getAllRequests, approveRequest, rejectRequest,
} = require('../controllers/upgradeController');

router.use(protect);

// User routes
router.post('/',    submitRequest);
router.get('/me',   getMyRequest);

// Admin routes
router.get('/',                    adminOnly, getAllRequests);
router.put('/:id/approve',         adminOnly, approveRequest);
router.put('/:id/reject',          adminOnly, rejectRequest);

module.exports = router;
