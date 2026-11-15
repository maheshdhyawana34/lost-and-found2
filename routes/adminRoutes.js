import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { Claim } from '../models/Claim.js';
import { memoryStore } from '../services/memoryStore.js';

const router = express.Router();

// All routes require Admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get system statistics dashboard
router.get('/stats', async (req, res) => {
  try {
    let totalItems = 0;
    let lostCount = 0;
    let foundCount = 0;
    let returnedCount = 0;
    let totalUsers = 0;
    let totalClaims = 0;

    try {
      totalItems = await Item.countDocuments();
      lostCount = await Item.countDocuments({ type: 'lost' });
      foundCount = await Item.countDocuments({ type: 'found' });
      returnedCount = await Item.countDocuments({ status: { $in: ['claimed', 'returned'] } });
      totalUsers = await User.countDocuments();
      totalClaims = await Claim.countDocuments();
    } catch (e) {
      const allItems = memoryStore.getItems({});
      totalItems = allItems.length;
      lostCount = allItems.filter(i => i.type === 'lost').length;
      foundCount = allItems.filter(i => i.type === 'found').length;
      returnedCount = allItems.filter(i => i.status === 'claimed' || i.status === 'returned').length;
      totalUsers = memoryStore.users.length;
      totalClaims = memoryStore.claims.length;
    }

    res.json({
      success: true,
      stats: {
        totalItems,
        lostCount,
        foundCount,
        returnedCount,
        totalUsers,
        totalClaims,
        recoveryRate: totalItems > 0 ? Math.round((returnedCount / totalItems) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all registered users list
router.get('/users', async (req, res) => {
  try {
    let users = [];
    try {
      users = await User.find().select('-password').sort({ createdAt: -1 });
    } catch (e) {
      users = memoryStore.users.map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
    }

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
