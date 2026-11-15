import express from 'express';
import { protect } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';
import { memoryStore } from '../services/memoryStore.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
router.get('/', protect, async (req, res) => {
  try {
    let notifications = [];
    try {
      notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    } catch (e) {
      notifications = memoryStore.getNotificationsForUser(req.user._id);
    }

    if (!notifications || notifications.length === 0) {
      notifications = memoryStore.getNotificationsForUser(req.user._id);
    }

    res.json({
      success: true,
      unreadCount: notifications.filter(n => !n.read).length,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    let notif = memoryStore.markNotificationRead(req.params.id);
    try {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
    } catch (e) {}

    res.json({
      success: true,
      notification: notif
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
