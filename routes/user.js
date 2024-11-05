import express from 'express';
import { getUsers, getUserProfile } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getUsers);
router.get('/profile', auth, getUserProfile);

export default router;