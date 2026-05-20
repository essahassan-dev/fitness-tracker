const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getSubscription, activatePremium, cancelSubscription,
  adminSetSubscription, stripeWebhook,
} = require('../controllers/subscriptionController');

// Stripe webhook — raw body needed (no auth)
router.post('/webhook', stripeWebhook);

// User routes
router.use(protect);
router.get('/',          getSubscription);
router.post('/activate', activatePremium);
router.post('/cancel',   cancelSubscription);

// Admin routes
router.put('/admin/:userId', adminOnly, adminSetSubscription);

module.exports = router;
