import { query } from '../database/index.js';

export const getRecentChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT c.id, c.type, 
                   COALESCE(c.name, (
                       SELECT u.username 
                       FROM chat_members cm2 
                       JOIN users u ON cm2.user_id = u.id 
                       WHERE cm2.chat_id = c.id AND cm2.user_id != $1 
                       LIMIT 1
                   )) as name,
                   (SELECT u.id 
                    FROM chat_members cm2 
                    JOIN users u ON cm2.user_id = u.id 
                    WHERE cm2.chat_id = c.id AND cm2.user_id != $1 
                    LIMIT 1) as other_user_id,
                   (SELECT CASE WHEN m.message_type = 'file' THEN '📎 File' ELSE m.content END FROM messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                   (SELECT COUNT(*)::int
                    FROM messages m
                    LEFT JOIN read_receipts rr ON rr.message_id = m.id AND rr.user_id = $1
                    WHERE m.chat_id = c.id AND m.sender_id != $1 AND rr.id IS NULL) as unread_count,
                   EXISTS (
                       SELECT 1 FROM favorites f
                       WHERE f.user_id = $1 AND (
                           (c.type = 'private' AND f.favorite_user_id = (
                               SELECT cm2.user_id 
                               FROM chat_members cm2 
                               WHERE cm2.chat_id = c.id AND cm2.user_id != $1 
                               LIMIT 1
                           ))
                           OR
                           (c.type = 'group' AND f.favorite_chat_id = c.id)
                       )
                   ) as is_favorite
            FROM chats c
            JOIN chat_members cm ON cm.chat_id = c.id
            WHERE cm.user_id = $1
            ORDER BY last_message_time DESC NULLS LAST
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
        const userId = req.user.id;

        // Auto mark as read on messages fetch
        await query(
            `INSERT INTO read_receipts (message_id, user_id)
             SELECT m.id, $2
             FROM messages m
             WHERE m.chat_id = $1 AND m.sender_id != $2
               AND NOT EXISTS (
                   SELECT 1 FROM read_receipts rr 
                   WHERE rr.message_id = m.id AND rr.user_id = $2
               )`,
            [chatId, userId]
        );

        const result = await query(
            `SELECT m.*, a.file_url, a.file_type, a.file_size
             FROM messages m
             LEFT JOIN attachments a ON a.message_id = m.id
             WHERE m.chat_id = $1
             ORDER BY m.created_at ASC LIMIT 100`,
            [chatId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createPrivateChat = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;

        const existingChat = await query(
            `SELECT c.id FROM chats c
             JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = $1
             JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = $2
             WHERE c.type = 'private'
             LIMIT 1`,
            [currentUserId, targetUserId]
        );

        if (existingChat.rows.length > 0) {
            return res.status(200).json({ id: existingChat.rows[0].id, type: 'private' });
        }

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
        console.error('createPrivateChat error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createGroupChat = async (req, res) => {
    try {
        const { userIds, name } = req.body;
        const currentUserId = req.user.id;

        if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'Group name and members are required' });
        }

        const allUserIds = Array.from(new Set([currentUserId, ...userIds]));

        if (allUserIds.length > 50) {
            return res.status(400).json({ error: 'Group cannot have more than 50 members' });
        }

        const client = await (await import('../database/index.js')).getClient();
        await client.query('BEGIN');

        const chatRes = await client.query(
            "INSERT INTO chats (type, name) VALUES ('group', $1) RETURNING id",
            [name]
        );
        const chatId = chatRes.rows[0].id;

        const values = allUserIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
            `INSERT INTO chat_members (chat_id, user_id) VALUES ${values}`,
            [chatId, ...allUserIds]
        );

        await client.query('COMMIT');
        client.release();

        res.status(201).json({ id: chatId, type: 'group', name });
    } catch (err) {
        console.error('createGroupChat error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getChatMembers = async (req, res) => {
    try {
        const { chatId } = req.params;
        const result = await query(
            `SELECT u.id, u.username, u.email, u.status 
             FROM chat_members cm
             JOIN users u ON u.id = cm.user_id
             WHERE cm.chat_id = $1`,
            [chatId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const markChatAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        await query(
            `INSERT INTO read_receipts (message_id, user_id)
             SELECT m.id, $2
             FROM messages m
             WHERE m.chat_id = $1 AND m.sender_id != $2
               AND NOT EXISTS (
                   SELECT 1 FROM read_receipts rr 
                   WHERE rr.message_id = m.id AND rr.user_id = $2
               )`,
            [chatId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const addGroupMembers = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'At least one member is required' });
        }

        const chatRes = await query("SELECT type FROM chats WHERE id = $1", [chatId]);
        if (chatRes.rows.length === 0) return res.status(404).json({ error: 'Chat not found' });
        if (chatRes.rows[0].type !== 'group') return res.status(400).json({ error: 'Not a group chat' });

        const existingMembers = await query(
            "SELECT user_id FROM chat_members WHERE chat_id = $1",
            [chatId]
        );
        const existingUserIds = existingMembers.rows.map(m => m.user_id);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(parseInt(id)));

        if (newUserIds.length === 0) {
            return res.status(400).json({ error: 'All selected users are already members' });
        }

        const values = newUserIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await query(
            `INSERT INTO chat_members (chat_id, user_id) VALUES ${values}`,
            [chatId, ...newUserIds]
        );

        res.json({ message: 'Members added successfully' });
    } catch (err) {
        console.error('addGroupMembers error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
