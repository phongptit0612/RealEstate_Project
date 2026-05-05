const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

// Stripe webhook must receive raw body (no JSON parsing)
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

// Authenticated routes
router.post('/checkout',  protect, ctrl.createCheckoutSession);
router.get('/mine',       protect, ctrl.getMySubscriptions);
router.post('/simulate',  protect, ctrl.simulatePayment); // dev only
module.exports = router;

