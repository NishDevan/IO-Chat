import express from 'express';
import { register, login, getMe, searchUsers, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/search', authMiddleware, searchUsers);
router.put('/profile', authMiddleware, updateProfile);

export default router;
