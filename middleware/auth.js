import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('decode', decoded);

    const user = await User.findById(decoded.userId);

    console.log('user middle', user);

    if (!user) {
      throw new Error('User not found');
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export default auth;