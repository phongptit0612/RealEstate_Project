const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect } = require('../middlewares/authMiddleware');

// ?
router.get('/search', propertyController.searchProperties);
router.get('/metadata', propertyController.getSearchMetadata);
router.get('/recently-viewed', protect, propertyController.getRecentlyViewed);
router.post('/', protect, propertyController.createProperty);
router.get('/me', protect, propertyController.getMyProperties);
router.patch('/:property_id/status', protect, propertyController.updatePropertyStatus);
router.patch('/:property_id/renew', protect, propertyController.renewListing);
router.put('/:property_id', protect, propertyController.updateProperty);
router.delete('/:property_id', protect, propertyController.deleteProperty);
router.get('/:id/images', protect, propertyController.getMyPropertyImages);
router.get('/:id/similar', propertyController.getSimilarProperties);
router.get('/:id', propertyController.getPropertyById);

module.exports = router;

