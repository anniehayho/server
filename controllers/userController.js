import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('user controller', req.user.id);
    console.log('req', req.user);
    if (!user) throw new Error('User not found 3');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};