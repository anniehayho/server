import express from 'express';
import { getMessages, createMessage } from '../controllers/messageController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:receiverId', auth, getMessages);
router.post('/', auth, createMessage);

export default router;