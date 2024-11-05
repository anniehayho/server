import Message from '../models/Message.js';

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.receiverId },
        { sender: req.params.receiverId, receiver: req.user.id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username')
    .populate('receiver', 'username');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const message = new Message({
      content,
      sender: req.user.id,
      receiver: receiverId
    });
    
    await message.save();
    await message.populate('sender', 'username');
    await message.populate('receiver', 'username');
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};