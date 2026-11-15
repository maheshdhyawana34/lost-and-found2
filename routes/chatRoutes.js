import express from 'express';
import { Chat } from '../models/Chat.js';
import { protect } from '../middleware/auth.js';
import { memoryStore } from '../services/memoryStore.js';

const router = express.Router();

// @route   GET /api/chat/messages/:itemId/:otherUserId
// @desc    Get chat message thread for an item between logged in user and another user
router.get('/messages/:itemId/:otherUserId', protect, async (req, res) => {
  try {
    const { itemId, otherUserId } = req.params;
    const currentUserId = req.user._id;

    let messages = [];
    try {
      messages = await Chat.find({
        item: itemId,
        $or: [
          { sender: currentUserId, receiver: otherUserId },
          { sender: otherUserId, receiver: currentUserId }
        ]
      }).sort({ createdAt: 1 });
    } catch (e) {
      messages = memoryStore.getChatMessages(itemId, currentUserId, otherUserId);
    }

    if (!messages || messages.length === 0) {
      messages = memoryStore.getChatMessages(itemId, currentUserId, otherUserId);
    }

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message via HTTP REST (fallback or initial trigger)
router.post('/send', protect, async (req, res) => {
  try {
    const { itemId, receiverId, message } = req.body;

    if (!itemId || !receiverId || !message) {
      return res.status(400).json({ success: false, message: 'itemId, receiverId, and message are required' });
    }

    const msgData = {
      item: itemId,
      sender: req.user._id,
      receiver: receiverId,
      message,
      read: false
    };

    let newMsg;
    try {
      newMsg = await Chat.create(msgData);
    } catch (e) {
      newMsg = memoryStore.addChatMessage(msgData);
    }

    res.status(201).json({
      success: true,
      message: newMsg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
