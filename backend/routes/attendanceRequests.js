const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { submitRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest } = require('../controllers/attendanceRequestController');

router.use(protect);
router.post('/',              submitRequest);
router.get('/my',             getMyRequests);
router.get('/',               adminOnly, getAllRequests);
router.put('/:id/approve',    adminOnly, approveRequest);
router.put('/:id/reject',     adminOnly, rejectRequest);

module.exports = router;
