import express from 'express';
import { getRecentChats, getMessages, createPrivateChat } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getRecentChats);
router.post('/private', createPrivateChat);
router.get('/:chatId/messages', getMessages);

export default router;
