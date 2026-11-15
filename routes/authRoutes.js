import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { memoryStore } from '../services/memoryStore.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_lost_and_found_key_2026_campus_skit', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Student / Staff / Admin)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, collegeId, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Check existing
    let existingUser = null;
    try {
      existingUser = await User.findOne({ email });
    } catch (e) {
      existingUser = memoryStore.findUserByEmail(email);
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      collegeId: collegeId || '',
      phone: phone || '',
      department: department || 'Engineering'
    };

    let user;
    try {
      user = await User.create(userData);
    } catch (dbErr) {
      user = memoryStore.createUser(userData);
    }

    const token = generateToken(user._id);

    const userResp = { ...user._doc || user };
    delete userResp.password;

    res.status(201).json({
      success: true,
      token,
      user: userResp
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    let user = null;
    try {
      user = await User.findOne({ email });
    } catch (e) {
      user = memoryStore.findUserByEmail(email);
    }

    if (!user) {
      user = memoryStore.findUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken(user._id);
    const userResp = { ...user._doc || user };
    delete userResp.password;

    res.json({
      success: true,
      token,
      user: userResp
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in user profile
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, collegeId, department, avatar } = req.body;

    let user = req.user;
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.collegeId = collegeId || user.collegeId;
    user.department = department || user.department;
    user.avatar = avatar || user.avatar;

    try {
      await User.findByIdAndUpdate(user._id, user);
    } catch (e) {
      // Memory store updated implicitly via object reference
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
