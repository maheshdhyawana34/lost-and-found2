import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  category: { 
    type: String, 
    enum: ['Electronics', 'Documents', 'Keys', 'Books & Stationery', 'Clothing & Bags', 'Accessories', 'Sports Gear', 'Others'],
    default: 'Others' 
  },
  location: { type: String, required: true }, // e.g. "Library 2nd Floor", "Canteen", "Block A Lab 3"
  date: { type: String, required: true }, // date lost or found
  images: [{ type: String }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'claimed', 'returned', 'closed'], default: 'active' },
  claimCount: { type: Number, default: 0 },
  secretQuestion: { type: String, default: '' }, // Optional security check e.g. "What wallpaper is on the phone?"
  reward: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
