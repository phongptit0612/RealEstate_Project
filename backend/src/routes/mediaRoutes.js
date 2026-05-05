const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/upload', protect, mediaController.uploadImages);

module.exports = router;
