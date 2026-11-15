import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { memoryStore } from '../services/memoryStore.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_lost_and_found_key_2026_campus_skit');

    // Try finding user in MongoDB, fallback to memoryStore if Mongo isn't connected
    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch (dbErr) {
      // Ignore Mongo error if memory mode active
    }

    if (!user) {
      user = memoryStore.findUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token verification failed or expired' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user?.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};
