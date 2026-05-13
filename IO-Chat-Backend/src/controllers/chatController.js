import { query } from '../database/index.js';

export const getRecentChats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Return latest messages grouped by chat, minimal query
        const sql = `
            SELECT c.id, c.type, c.name, 
                   (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
            FROM chats c
            JOIN chat_members cm ON cm.chat_id = c.id
            WHERE cm.user_id = $1
        `;
        const result = await query(sql, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const result = await query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC LIMIT 100',
            [chatId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createPrivateChat = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;

        // Ensure chat doesn't exist already! 
        // This is simplified. In a real app we check if they already have a private chat.

        const client = await (await import('../database/index.js')).getClient();
        await client.query('BEGIN');
        
        const chatRes = await client.query(
            "INSERT INTO chats (type) VALUES ('private') RETURNING id"
        );
        const chatId = chatRes.rows[0].id;

        await client.query(
            "INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)",
            [chatId, currentUserId, targetUserId]
        );

        await client.query('COMMIT');
        client.release();

        res.status(201).json({ id: chatId, type: 'private' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
