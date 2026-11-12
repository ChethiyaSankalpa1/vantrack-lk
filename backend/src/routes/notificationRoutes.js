const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const Notification = require('../models/Notification');
const { registerFcmToken, sendNotification } = require('../services/notificationService');

// Get notifications for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark single notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register FCM Device Token
router.post('/fcm-token', protect, async (req, res) => {
  try {
    const { token, device = 'android' } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }
    await registerFcmToken(req.user._id, token, device);
    res.status(200).json({ success: true, message: 'FCM token registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send test push notification
router.post('/test', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const notif = await sendNotification({
      userId: req.user._id,
      title: req.body.title || '🔔 VanTrack LK Notification Test',
      message: req.body.message || 'Push and in-app notifications are working properly!',
      type: 'general',
      io,
    });
    res.status(200).json({ success: true, message: 'Notification sent', data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
