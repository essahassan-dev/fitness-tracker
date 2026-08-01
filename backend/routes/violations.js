const express = require('express');
const router  = express.Router();
const { protect, superAdminOnly } = require('../middleware/auth');
const {
  getRules, createViolation, getAllViolations, getUserViolations,
  resolveViolation, dismissViolation, getBlacklist, reportViolation,
} = require('../controllers/violationController');

// Public (any authenticated user): read rules + submit a report
router.get('/rules',                 protect, getRules);
router.post('/report',               protect, reportViolation);

// Super admin only
router.get('/',                      protect, superAdminOnly, getAllViolations);
router.post('/',                     protect, superAdminOnly, createViolation);
router.get('/blacklist',             protect, superAdminOnly, getBlacklist);
router.get('/user/:userId',          protect, superAdminOnly, getUserViolations);
router.put('/:id/resolve',           protect, superAdminOnly, resolveViolation);
router.put('/:id/dismiss',           protect, superAdminOnly, dismissViolation);

module.exports = router;
