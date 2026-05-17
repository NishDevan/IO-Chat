import express from 'express';
import { getRecentChats, getMessages, createPrivateChat, createGroupChat, getChatMembers, markChatAsRead, addGroupMembers, toggleArchiveChat } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getRecentChats);
router.post('/private', createPrivateChat);
router.post('/group', createGroupChat);
router.post('/group/:chatId/members', addGroupMembers);
router.get('/:chatId/messages', getMessages);
router.get('/:chatId/members', getChatMembers);
router.post('/:chatId/read', markChatAsRead);
router.put('/archive', toggleArchiveChat);


export default router;
