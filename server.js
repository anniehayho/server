import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/message.js';
import userRoutes from './routes/user.js';
import friendRoutes from './routes/friend.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import cors from 'cors';

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://3.136.200.153:3000',
    credentials: true
  }
});

connectDB();

app.use(cors({
  origin: 'http://3.136.200.153:3000',
  credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);

// Socket middleware for authentication
io.use(async (socket, next) => {
  console.log('Socket middleware:', socket.id);
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      id: user._id,
      username: user.username
    };
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Keep track of online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.username);
  
  // Add user to online users
  onlineUsers.set(socket.user.id.toString(), socket.id);
  
  // Broadcast online users to all connected clients
  io.emit('user-status', Array.from(onlineUsers.keys()));

  // Handle private messages
  socket.on('send-message', async (message) => {
    try {
      const receiverSocketId = onlineUsers.get(message.receiver);
      if (receiverSocketId) {
        // Send to specific user
        io.to(receiverSocketId).emit('receive-message', {
          ...message,
          sender: socket.user.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', {
        userId: socket.user.id,
        username: socket.user.username
      });
    }
  });

  // Handle stop typing
  socket.on('stop-typing', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', {
        userId: socket.user.id
      });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.username);
    onlineUsers.delete(socket.user.id.toString());
    io.emit('user-status', Array.from(onlineUsers.keys()));
  });

  // Handle friend requests
  socket.on('friend-request', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-friend-request', {
        userId: socket.user.id,
        username: socket.user.username
      });
    }
  });

  // Handle read receipts
  socket.on('message-read', (data) => {
    const senderSocketId = onlineUsers.get(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message-read-receipt', {
        messageId: data.messageId,
        readBy: socket.user.id
      });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});