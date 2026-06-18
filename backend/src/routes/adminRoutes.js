const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.use(protect, adminOnly);

// Dashboard
router.get('/stats', adminController.getStats);
router.get('/audit-log', adminController.getAuditLog);

// Listings moderation
router.get('/listings', adminController.getListings);
router.get('/listings/:id', adminController.getListingById);
router.patch('/listings/:id/approve', adminController.approveListing);
router.patch('/listings/:id/reject', adminController.rejectListing);
router.patch('/listings/:id', adminController.updateListing);
router.delete('/listings/:id', adminController.deleteListing);

// Users management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle', adminController.toggleUser);
router.delete('/users/:id', adminController.deleteUser);

// Reports
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReport);

// Category management — Cities
router.get('/cities', adminController.getCities);
router.post('/cities', adminController.createCity);
router.delete('/cities/:id', adminController.deleteCity);

// Category management — Districts
router.get('/districts', adminController.getDistricts);
router.post('/districts', adminController.createDistrict);
router.delete('/districts/:id', adminController.deleteDistrict);

// Category management — Property Types
router.get('/property-types', adminController.getPropertyTypes);
router.post('/property-types', adminController.createPropertyType);
router.delete('/property-types/:id', adminController.deletePropertyType);

// Category management — Features / Amenities
router.get('/features', adminController.getFeatures);
router.post('/features', adminController.createFeature);
router.delete('/features/:id', adminController.deleteFeature);

module.exports = router;
