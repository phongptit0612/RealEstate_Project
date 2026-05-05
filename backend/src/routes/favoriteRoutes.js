const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');

// All favorites routes require authentication
router.use(protect);

// GET /api/favorites  — Get all favorited properties for the logged-in user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const [favorites] = await pool.query(`
            SELECT p.*, pt.name as type_name,
                   d.name as district_name, c.name as city_name,
                   f.favorite_id, f.created_at as saved_at,
                   (SELECT image_url FROM property_images WHERE property_id = p.property_id AND sort_order = 1 LIMIT 1) as primary_image
            FROM favorites f
            JOIN properties p ON f.property_id = p.property_id
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);

        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/favorites/ids  — Get just the property IDs favorited by user (for UI state sync)
router.get('/ids', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT property_id FROM favorites WHERE user_id = ?',
            [req.user.userId]
        );
        res.json(rows.map(r => r.property_id));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/favorites/:property_id  — Toggle favorite (add if not exists, remove if exists)
router.post('/:property_id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { property_id } = req.params;

        // Check if already favorited
        const [existing] = await pool.query(
            'SELECT favorite_id FROM favorites WHERE user_id = ? AND property_id = ?',
            [userId, property_id]
        );

        if (existing.length > 0) {
            // Remove favorite
            await pool.query(
                'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
                [userId, property_id]
            );
            res.json({ favorited: false, message: 'Removed from favorites' });
        } else {
            // Add favorite
            await pool.query(
                'INSERT INTO favorites (user_id, property_id) VALUES (?, ?)',
                [userId, property_id]
            );
            res.json({ favorited: true, message: 'Added to favorites' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
