import express from 'express';
<<<<<<< HEAD
import { getRecentChats, getMessages, createPrivateChat, createGroupChat, getChatMembers, markChatAsRead } from '../controllers/chatController.js';
=======
import { getRecentChats, getMessages, createPrivateChat, createGroupChat, getChatMembers, addGroupMembers } from '../controllers/chatController.js';
>>>>>>> d4c2a03b501d39a2e593aaa44b3633e808c5e9f3
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


export default router;
