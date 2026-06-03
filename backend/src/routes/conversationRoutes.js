const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// ── GET /api/conversations/unread-count ── Badge count for sidebar
// IMPORTANT: This must be defined BEFORE /:id routes to avoid matching 'unread-count' as an id
router.get('/unread-count', async (req, res) => {
    try {
        const [[{ count }]] = await pool.query(`
            SELECT COUNT(*) as count FROM messages m
            JOIN conversations c ON m.conversation_id = c.conversation_id
            WHERE (c.buyer_id = ? OR c.seller_id = ?)
            AND m.sender_id != ? AND m.is_read = 0
        `, [req.user.userId, req.user.userId, req.user.userId]);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const [conversations] = await pool.query(`
            SELECT 
                c.*,
                p.title as property_title,
                buyer.user_id as buyer_id, buyer.full_name as buyer_name, buyer.avatar_url as buyer_avatar,
                seller.user_id as seller_id, seller.full_name as seller_name, seller.avatar_url as seller_avatar,
                (SELECT body FROM messages WHERE conversation_id = c.conversation_id ORDER BY sent_at DESC LIMIT 1) as last_message,
                (SELECT sent_at FROM messages WHERE conversation_id = c.conversation_id ORDER BY sent_at DESC LIMIT 1) as last_message_at,
                (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND sender_id != ? AND is_read = 0) as unread_count
            FROM conversations c
            LEFT JOIN properties p ON c.property_id = p.property_id
            JOIN users buyer ON c.buyer_id = buyer.user_id
            JOIN users seller ON c.seller_id = seller.user_id
            WHERE c.buyer_id = ? OR c.seller_id = ?
            ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        `, [userId, userId, userId]);

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { property_id, seller_id } = req.body;
        const buyer_id = req.user.userId;

        if (buyer_id === parseInt(seller_id)) {
            return res.status(400).json({ error: 'You cannot message yourself' });
        }

        const [existing] = await pool.query(
            'SELECT * FROM conversations WHERE property_id = ? AND buyer_id = ? AND seller_id = ?',
            [property_id || null, buyer_id, seller_id]
        );

        if (existing.length > 0) {
            return res.json({ conversation: existing[0], created: false });
        }

        const [result] = await pool.query(
            'INSERT INTO conversations (property_id, buyer_id, seller_id) VALUES (?, ?, ?)',
            [property_id || null, buyer_id, seller_id]
        );

        const [[conversation]] = await pool.query('SELECT * FROM conversations WHERE conversation_id = ?', [result.insertId]);
        res.status(201).json({ conversation, created: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id/messages', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { before, limit = 50 } = req.query;

        const [[conv]] = await pool.query(
            'SELECT * FROM conversations WHERE conversation_id = ? AND (buyer_id = ? OR seller_id = ?)',
            [id, userId, userId]
        );
        if (!conv) return res.status(403).json({ error: 'Not authorized' });

        let query = `
            SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.conversation_id = ?
        `;
        const params = [id];

        if (before) {
            query += ' AND m.message_id < ?';
            params.push(before);
        }

        query += ' ORDER BY m.sent_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [messages] = await pool.query(query, params);

        // Mark messages as read
        await pool.query(
            'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0',
            [id, userId]
        );

        res.json(messages.reverse()); // Return oldest-first for rendering
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
