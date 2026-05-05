const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', notifController.getNotifications);
router.patch('/read-all', notifController.markAllRead);
router.patch('/:id/read', notifController.markRead);

module.exports = router;
