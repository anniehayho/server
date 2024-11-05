import express from 'express';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getFriends,
  getPendingRequests 
} from '../controllers/friendController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/request', auth, sendFriendRequest);
router.patch('/accept/:requestId', auth, acceptFriendRequest);
router.delete('/reject/:requestId', auth, rejectFriendRequest);
router.get('/list', auth, getFriends);
router.get('/pending', auth, getPendingRequests);

export default router;