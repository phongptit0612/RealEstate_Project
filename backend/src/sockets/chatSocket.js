const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Map userId (number) -> Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

module.exports = function (io) {

    // ── Auth middleware ──────────────────────────────────────────────────────
    // Accepts userId from socket auth payload (sent by frontend) OR JWT cookie
    io.use(async (socket, next) => {
        try {
            // 1. Try auth payload first (most reliable)
            const userId = socket.handshake.auth?.userId;
            if (userId) {
                const [[user]] = await pool.query(
                    'SELECT user_id FROM users WHERE user_id = ? AND is_active = 1',
                    [Number(userId)]
                );
                if (!user) return next(new Error('User not found or suspended'));
                socket.userId = Number(userId);
                return next();
            }

            // 2. Fallback: try to extract JWT from cookie
            const cookie = socket.handshake.headers?.cookie || '';
            const match = cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
            if (match) {
                const decoded = jwt.verify(
                    match[1],
                    process.env.JWT_SECRET || 'super_secret_jwt_key_you_can_use_anything_in_dev'
                );
                socket.userId = Number(decoded.userId);
                return next();
            }

            return next(new Error('Authentication required'));
        } catch (err) {
            return next(new Error('Invalid auth: ' + err.message));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`[Socket] User ${userId} connected — ${socket.id}`);

        // ── Track online presence ──────────────────────────────────────────
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);

        // Join personal room so server can push direct events
        socket.join(`user_${userId}`);

        // Tell everyone this user is now online
        io.emit('user_online', { userId, online: true });

        // Send the full online list to the newly connected socket
        const onlineList = Array.from(onlineUsers.keys());
        socket.emit('online_list', onlineList);

        // ── JOIN a conversation room ───────────────────────────────────────
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conv_${conversationId}`);
            console.log(`[Socket] User ${userId} joined conv_${conversationId}`);
        });

        // ── LEAVE a conversation room ──────────────────────────────────────
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conv_${conversationId}`);
        });

        // ── SEND a message ─────────────────────────────────────────────────
        socket.on('send_message', async ({ conversation_id, receiver_id, body, type = 'text' }) => {
            if (!conversation_id || !body?.trim()) return;

            try {
                // Persist to DB
                const [result] = await pool.query(
                    'INSERT INTO messages (conversation_id, sender_id, body, type) VALUES (?, ?, ?, ?)',
                    [conversation_id, userId, body.trim(), type]
                );

                await pool.query(
                    'UPDATE conversations SET last_message_at = NOW() WHERE conversation_id = ?',
                    [conversation_id]
                );

                const message = {
                    message_id: result.insertId,
                    conversation_id: Number(conversation_id),
                    sender_id: userId,
                    body: body.trim(),
                    type,
                    is_read: 0,
                    sent_at: new Date().toISOString(),
                };

                // ① Broadcast to all sockets in the conversation room
                io.to(`conv_${conversation_id}`).emit('new_message', message);

                // ② Also push directly to receiver's personal room
                //    (in case they have the inbox open but haven't joined this conv room)
                io.to(`user_${receiver_id}`).emit('new_message', message);

                // ③ Notify receiver's inbox list to refresh
                io.to(`user_${receiver_id}`).emit('inbox_update', {
                    conversation_id: Number(conversation_id),
                    last_message: body.trim(),
                    from_user_id: userId,
                });

                // Persist notification
                try {
                    await pool.query(
                        `INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type)
                         VALUES (?, 'message', 'New Message', ?, ?, 'conversation')`,
                        [receiver_id, body.trim().substring(0, 100), conversation_id]
                    );
                } catch (_) { /* non-critical */ }

            } catch (error) {
                console.error('[Socket] send_message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ── MARK messages as read ──────────────────────────────────────────
        socket.on('mark_read', async ({ conversation_id }) => {
            try {
                await pool.query(
                    'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0',
                    [conversation_id, userId]
                );
                // Tell the other party their messages were read
                socket.to(`conv_${conversation_id}`).emit('messages_read', {
                    conversation_id,
                    by_user: userId,
                });
            } catch (error) {
                console.error('[Socket] mark_read error:', error);
            }
        });

        // ── TYPING indicator ───────────────────────────────────────────────
        socket.on('typing', ({ conversation_id, isTyping }) => {
            socket.to(`conv_${conversation_id}`).emit('user_typing', { userId, isTyping });
        });

        // ── Disconnect ─────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user_online', { userId, online: false });
                }
            }
            console.log(`[Socket] User ${userId} disconnected — ${socket.id}`);
        });
    });
};
