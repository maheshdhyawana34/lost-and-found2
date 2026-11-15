import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
