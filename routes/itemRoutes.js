import express from 'express';
import { Item } from '../models/Item.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { memoryStore } from '../services/memoryStore.js';

const router = express.Router();

// @route   GET /api/items
// @desc    Get all items with search, filter, category & pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, type, location, status } = req.query;

    let items = [];
    try {
      let query = {};
      if (type && type !== 'all') query.type = type;
      if (category && category !== 'all') query.category = category;
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }
      items = await Item.find(query).populate('postedBy', 'name email avatar phone collegeId').sort({ createdAt: -1 });
    } catch (e) {
      items = memoryStore.getItems({ search, category, type, location, status });
    }

    if (!items || items.length === 0) {
      items = memoryStore.getItems({ search, category, type, location, status });
    }

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/items/user/my-items
// @desc    Get items posted by current logged in user
router.get('/user/my-items', protect, async (req, res) => {
  try {
    let items = [];
    try {
      items = await Item.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    } catch (e) {
      items = memoryStore.getItems({}).filter(i => (i.postedBy._id || i.postedBy) === req.user._id);
    }

    if (!items || items.length === 0) {
      items = memoryStore.getItems({}).filter(i => (i.postedBy._id || i.postedBy) === req.user._id);
    }

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item details
router.get('/:id', async (req, res) => {
  try {
    let item = null;
    try {
      item = await Item.findById(req.params.id).populate('postedBy', 'name email avatar phone collegeId department');
    } catch (e) {
      item = memoryStore.getItemById(req.params.id);
    }

    if (!item) {
      item = memoryStore.getItemById(req.params.id);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/items
// @desc    Report new Lost or Found item
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, type, category, location, date, secretQuestion, reward, contactPhone } = req.body;

    if (!title || !description || !type || !location || !date) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (title, description, type, location, date)' });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.body.imageUrl) {
      imageUrls = [req.body.imageUrl];
    } else {
      // Default placeholder based on category
      imageUrls = ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&q=80&w=800'];
    }

    const itemData = {
      title,
      description,
      type,
      category: category || 'Others',
      location,
      date,
      images: imageUrls,
      postedBy: req.user._id,
      secretQuestion: secretQuestion || '',
      reward: reward || '',
      contactPhone: contactPhone || req.user.phone || '',
      status: 'active'
    };

    let newItem;
    try {
      newItem = await Item.create(itemData);
      newItem = await Item.findById(newItem._id).populate('postedBy', 'name email avatar phone');
    } catch (dbErr) {
      newItem = memoryStore.createItem(itemData, req.user);
    }

    res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} item reported successfully!`,
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item status or details
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, title, description, location } = req.body;

    let item;
    try {
      item = await Item.findById(req.params.id);
    } catch (e) {
      item = memoryStore.getItemById(req.params.id);
    }

    if (!item) {
      item = memoryStore.getItemById(req.params.id);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Verify ownership or admin
    const ownerId = item.postedBy._id || item.postedBy;
    if (ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this item' });
    }

    if (status) item.status = status;
    if (title) item.title = title;
    if (description) item.description = description;
    if (location) item.location = location;

    try {
      await Item.findByIdAndUpdate(req.params.id, item);
    } catch (e) {
      memoryStore.updateItem(req.params.id, item);
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
router.delete('/:id', protect, async (req, res) => {
  try {
    let item;
    try {
      item = await Item.findById(req.params.id);
    } catch (e) {
      item = memoryStore.getItemById(req.params.id);
    }

    if (!item) {
      item = memoryStore.getItemById(req.params.id);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const ownerId = item.postedBy._id || item.postedBy;
    if (ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
    }

    try {
      await Item.findByIdAndDelete(req.params.id);
    } catch (e) {
      memoryStore.deleteItem(req.params.id);
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
