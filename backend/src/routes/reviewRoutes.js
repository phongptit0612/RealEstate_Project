const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validators');

// Public route to view agent reviews
router.get('/agent/:agentId', reviewController.getAgentReviews);

// Protected routes to write / delete reviews
router.post('/', protect, validate(schemas.createReview), reviewController.createReview);
router.delete('/:review_id', protect, reviewController.deleteReview);

module.exports = router;
