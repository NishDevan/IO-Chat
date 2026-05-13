import express from 'express';
import authRoutes from './auth.js';
import chatRoutes from './chats.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);

export default router;
