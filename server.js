import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/message.js';
import userRoutes from './routes/user.js';
import friendRoutes from './routes/friend.js';


dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('user-status', Array.from(onlineUsers.keys()));
  });

  socket.on('send-message', async (message) => {
    const receiverSocket = onlineUsers.get(message.receiver);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive-message', message);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUser;
    for (const [user, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = user;
        break;
      }
    }
    if (disconnectedUser) {
      onlineUsers.delete(disconnectedUser);
      io.emit('user-status', Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});