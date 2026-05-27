const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

router.post('/checkout', protect, ctrl.createCheckoutSession);
router.get('/mine', protect, ctrl.getMySubscriptions);
router.post('/simulate', protect, ctrl.simulatePayment); // dev only
module.exports = router;

