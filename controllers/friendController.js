import Friend from '../models/Friend.js';
import User from '../models/User.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === recipientId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if users exist
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Check if friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

    // Create friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    await friendRequest.save();
    
    // Populate requester details for response
    await friendRequest.populate('requester', 'username email');
    res.status(201).json(friendRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'username email');

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    friendRequest.status = 'accepted';

    await User.findByIdAndUpdate(userId, {
      $push: { friends: friendRequest.requester }
    })

    await User.findByIdAndUpdate(friendRequest.requester, {
      $push: { friends: userId }
    })

    res.json(friendRequest);
    await friendRequest.save();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    console.log('Attempting to reject request:', {
      requestId,
      userId
    });

    // First find the request to verify it exists
    const existingRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });

    console.log('Existing request:', existingRequest);

    if (!existingRequest) {
      return res.status(404).json({ 
        error: 'Friend request not found',
        details: 'Request may not exist or you may not have permission to reject it'
      });
    }

    // Now delete it
    const deleteResult = await Friend.deleteOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });

    console.log('Delete result:', deleteResult);

    if (deleteResult.deletedCount === 0) {
      return res.status(400).json({ 
        error: 'Failed to delete request',
        details: 'Request exists but could not be deleted'
      });
    }

    res.json({ 
      message: 'Friend request rejected successfully',
      requestId,
      deletedCount: deleteResult.deletedCount 
    });

  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const friends = await Friend.find({
      $and: [
        { $or: [{ requester: userId }, { recipient: userId }] },
        { status: 'accepted' }
      ]
    })
    .populate('requester', 'username email')
    .populate('recipient', 'username email');
    
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await Friend.find({
      recipient: req.user.id,
      status: 'pending'
    })
    .populate('requester', 'username email')
    .sort('-createdAt');
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

