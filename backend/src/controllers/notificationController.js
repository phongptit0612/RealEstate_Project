const pool = require('../config/db');

// GET /api/notifications — user's latest 20 notifications
exports.getNotifications = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const [notifications] = await pool.query(`
            SELECT notification_id, type, title, body, ref_id, ref_type, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        `, [user_id]);
        const [[{ unread_count }]] = await pool.query(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0', [user_id]
        );
        res.json({ notifications, unread_count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/notifications/read-all — mark all as read
exports.markAllRead = async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.userId]);
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/notifications/:id/read — mark single as read
exports.markRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
