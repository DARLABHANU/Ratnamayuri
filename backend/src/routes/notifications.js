const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { getCurrentUser } = require('../middleware/auth');

router.get('/', getCurrentUser, notificationController.getMyNotifications);
router.put('/:id/read', getCurrentUser, notificationController.markAsRead);

module.exports = router;
