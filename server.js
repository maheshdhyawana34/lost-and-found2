import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { memoryStore } from './services/memoryStore.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads static directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Base Health Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SKIT Campus Lost & Found API Portal',
    timestamp: new Date()
  });
});

// Real-Time Socket.io Connections
const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 Socket Connected: ${socket.id}`);

  socket.on('join', (userId) => {
    if (userId) {
      userSockets.set(userId.toString(), socket.id);
      socket.userId = userId.toString();
      console.log(`👤 User Registered on Socket: ${userId}`);
    }
  });

  socket.on('send_message', (data) => {
    const { itemId, senderId, receiverId, message } = data;
    const msg = memoryStore.addChatMessage({
      item: itemId,
      sender: senderId,
      receiver: receiverId,
      message
    });

    const receiverSocketId = userSockets.get(receiverId?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', msg);
    }
    // Also echo back to sender
    socket.emit('message_sent', msg);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
    console.log(`❌ Socket Disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SKIT Lost & Found Backend Server running on port ${PORT}`);
});
