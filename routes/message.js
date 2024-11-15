import express from 'express';
import { getMessages, createMessage, markMessageAsRead } from '../controllers/messageController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:receiverId', auth, getMessages);
router.patch('/:messageId/read', auth, markMessageAsRead);
router.post('/', auth, createMessage);

export default router;