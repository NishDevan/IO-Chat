import { Server } from 'socket.io';
import redis from '../services/redis.js';
import { verifyToken } from '../utils/jwt.js';
import { query } from '../database/index.js';

export function initializeSockets(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*' }
    });

    // auth middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));
        try {
            const decoded = verifyToken(token);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.userId}`);
        
        // Save presence in Redis
        await redis.set(`user:online:${socket.userId}`, socket.id);
        io.emit('user_online', { userId: socket.userId });

        socket.on('join_room', (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.userId} joined room ${chatId}`);
        });

        socket.on('leave_room', (chatId) => {
            socket.leave(chatId);
        });

        socket.on('typing', ({ chatId }) => {
            socket.to(chatId).emit('user_typing', { userId: socket.userId, chatId });
        });

        socket.on('stop_typing', ({ chatId }) => {
            socket.to(chatId).emit('user_stop_typing', { userId: socket.userId, chatId });
        });

        socket.on('send_message', async ({ chatId, content }) => {
            try {
                // Save to DB
                const result = await query(
                    'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
                    [chatId, socket.userId, content]
                );
                
                const msg = result.rows[0];
                
                // Broadcast to room
                io.to(chatId).emit('receive_message', msg);
            } catch (err) {
                console.error('Save message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.userId}`);
            await redis.del(`user:online:${socket.userId}`);
            io.emit('user_offline', { userId: socket.userId });
        });
    });

    return io;
}
