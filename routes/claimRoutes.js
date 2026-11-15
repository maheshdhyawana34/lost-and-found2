import express from 'express';
import { Claim } from '../models/Claim.js';
import { Item } from '../models/Item.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { memoryStore } from '../services/memoryStore.js';

const router = express.Router();

// @route   POST /api/claims
// @desc    Submit a claim for a lost or found item
router.post('/', protect, upload.array('proofImages', 3), async (req, res) => {
  try {
    const { itemId, proofDescription } = req.body;

    if (!itemId || !proofDescription) {
      return res.status(400).json({ success: false, message: 'Item ID and proof description are required' });
    }

    let item;
    try {
      item = await Item.findById(itemId);
    } catch (e) {
      item = memoryStore.getItemById(itemId);
    }
    if (!item) item = memoryStore.getItemById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Target item not found' });
    }

    let proofImages = [];
    if (req.files && req.files.length > 0) {
      proofImages = req.files.map(f => `/uploads/${f.filename}`);
    }

    const claimData = {
      item: itemId,
      claimant: req.user,
      proofDescription,
      proofImages,
      status: 'pending'
    };

    let newClaim;
    try {
      newClaim = await Claim.create({
        ...claimData,
        claimant: req.user._id
      });
      // Increment claim count
      await Item.findByIdAndUpdate(itemId, { $inc: { claimCount: 1 } });
    } catch (e) {
      newClaim = memoryStore.createClaim(claimData);
    }

    // Add notification to item poster
    const posterId = item.postedBy._id || item.postedBy;
    memoryStore.addNotification({
      user: posterId,
      title: 'New Claim Received!',
      message: `${req.user.name} submitted a claim proof for item: "${item.title}"`,
      link: `/items/${itemId}`
    });

    res.status(201).json({
      success: true,
      message: 'Claim request submitted successfully! The item poster has been notified.',
      claim: newClaim
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/claims/item/:itemId
// @desc    Get all claims submitted for a specific item (for item poster)
router.get('/item/:itemId', protect, async (req, res) => {
  try {
    let claims = [];
    try {
      claims = await Claim.find({ item: req.params.itemId })
        .populate('claimant', 'name email avatar phone collegeId department')
        .sort({ createdAt: -1 });
    } catch (e) {
      claims = memoryStore.getClaimsForItem(req.params.itemId);
    }

    if (!claims || claims.length === 0) {
      claims = memoryStore.getClaimsForItem(req.params.itemId);
    }

    res.json({
      success: true,
      count: claims.length,
      claims
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/claims/my-claims
// @desc    Get claims submitted by current user
router.get('/my-claims', protect, async (req, res) => {
  try {
    let claims = [];
    try {
      claims = await Claim.find({ claimant: req.user._id })
        .populate('item')
        .sort({ createdAt: -1 });
    } catch (e) {
      claims = memoryStore.getClaimsForUser(req.user._id);
    }

    if (!claims || claims.length === 0) {
      claims = memoryStore.getClaimsForUser(req.user._id);
    }

    res.json({
      success: true,
      count: claims.length,
      claims
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/claims/:id/status
// @desc    Approve or Reject a claim request
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, responseNote } = req.body; // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    let claim = memoryStore.updateClaimStatus(req.params.id, status, responseNote);
    try {
      const updated = await Claim.findByIdAndUpdate(req.params.id, { status, responseNote }, { new: true });
      if (updated) claim = updated;
      if (status === 'approved') {
        await Item.findByIdAndUpdate(claim.item, { status: 'claimed' });
      }
    } catch (e) {
      // Memory store already updated above
    }

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Notify claimant
    const claimantId = claim.claimant?._id || claim.claimant;
    memoryStore.addNotification({
      user: claimantId,
      title: `Claim ${status.toUpperCase()}!`,
      message: `Your claim for item was marked as ${status}. ${responseNote ? 'Note: ' + responseNote : ''}`,
      link: '/dashboard'
    });

    res.json({
      success: true,
      message: `Claim status updated to ${status}`,
      claim
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
