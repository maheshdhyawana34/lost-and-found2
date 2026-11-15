import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proofDescription: { type: String, required: true },
  proofImages: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  responseNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Claim = mongoose.models.Claim || mongoose.model('Claim', claimSchema);
