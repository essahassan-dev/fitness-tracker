const express = require('express');
const router  = express.Router();
const { protect, superAdminOnly } = require('../middleware/auth');

// Controllers
const {
  getDashboardStats, getPlatformStats, getAllAdmins, getAdminDetail,
  toggleAdminStatus, createAdmin, deleteAdmin, getAllUsers, banUser,
} = require('../controllers/superAdminController');

const {
  listBusinesses, getBusinessDetail, updateBusiness,
  suspendBusiness, activateBusiness, softDeleteBusiness,
  changeBusinessPlan, extendSubscription, resetAdminPassword,
} = require('../controllers/businessController');

const { listPlans, createPlan, updatePlan, togglePlanStatus, deletePlan } = require('../controllers/planController');

const { listRequests, approveRequest, rejectRequest, requestMoreInfo } = require('../controllers/subscriptionRequestController');

const { listPayments, refundPayment, exportPayments } = require('../controllers/superAdminPaymentController');

const { listAuditLogs } = require('../controllers/auditController');

const { getSettings, getAllSettings, updateSettings, testSmtp, createApiKey, revokeApiKey } = require('../controllers/settingsController');

const { listSessions, forceLogoutSession } = require('../controllers/sessionController');

const {
  getAllViolations, createViolation, getUserViolations,
  resolveViolation, dismissViolation, getBlacklist,
} = require('../controllers/violationController');

// All routes protected
router.use(protect, superAdminOnly);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',    getDashboardStats);
router.get('/stats',              getPlatformStats);  // legacy

// ── Admin accounts (legacy) ────────────────────────────────────────────────────
router.get('/admins',             getAllAdmins);
router.get('/admins/:id',         getAdminDetail);
router.post('/admins',            createAdmin);
router.put('/admins/:id/status',  toggleAdminStatus);
router.delete('/admins/:id',      deleteAdmin);

// ── Platform users (legacy + monitor) ─────────────────────────────────────────
router.get('/users',              getAllUsers);
router.put('/users/:id/ban',      banUser);

// ── Businesses ─────────────────────────────────────────────────────────────────
router.get('/businesses',                      listBusinesses);
router.get('/businesses/:id',                  getBusinessDetail);
router.put('/businesses/:id',                  updateBusiness);
router.put('/businesses/:id/suspend',          suspendBusiness);
router.put('/businesses/:id/activate',         activateBusiness);
router.delete('/businesses/:id',               softDeleteBusiness);
router.put('/businesses/:id/change-plan',      changeBusinessPlan);
router.put('/businesses/:id/extend',           extendSubscription);
router.post('/businesses/:id/reset-password',  resetAdminPassword);

// ── Subscription plans ─────────────────────────────────────────────────────────
router.get('/plans',              listPlans);
router.post('/plans',             createPlan);
router.put('/plans/:id',          updatePlan);
router.put('/plans/:id/toggle',   togglePlanStatus);
router.delete('/plans/:id',       deletePlan);

// ── Subscription requests ──────────────────────────────────────────────────────
router.get('/subscription-requests',                   listRequests);
router.put('/subscription-requests/:id/approve',       approveRequest);
router.put('/subscription-requests/:id/reject',        rejectRequest);
router.put('/subscription-requests/:id/info',          requestMoreInfo);

// ── Payments ───────────────────────────────────────────────────────────────────
router.get('/payments',            listPayments);
router.get('/payments/export',     exportPayments);
router.put('/payments/:id/refund', refundPayment);

// ── Audit logs ─────────────────────────────────────────────────────────────────
router.get('/audit-logs',          listAuditLogs);

// ── Settings ───────────────────────────────────────────────────────────────────
router.get('/settings',                 getAllSettings);
router.get('/settings/:key',            getSettings);
router.patch('/settings/:key',          updateSettings);
router.post('/settings/smtp/test',      testSmtp);
router.post('/settings/api-keys',       createApiKey);
router.delete('/settings/api-keys/:id', revokeApiKey);

// ── Sessions ───────────────────────────────────────────────────────────────────
router.get('/sessions',          listSessions);
router.delete('/sessions/:id',   forceLogoutSession);

// ── Violations (existing) ──────────────────────────────────────────────────────
router.get('/violations',              getAllViolations);
router.get('/violations/blacklist',    getBlacklist);
router.get('/violations/user/:userId', getUserViolations);
router.put('/violations/:id/resolve',  resolveViolation);
router.put('/violations/:id/dismiss',  dismissViolation);

module.exports = router;
