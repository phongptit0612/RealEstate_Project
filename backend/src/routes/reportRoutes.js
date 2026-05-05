const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/reports  — Submit a report for a listing
router.post('/', protect, async (req, res) => {
    try {
        const { property_id, reason, details } = req.body;
        if (!property_id || !reason) return res.status(400).json({ error: 'property_id and reason are required' });

        await pool.query(
            'INSERT INTO reports (reporter_id, property_id, reason, details) VALUES (?, ?, ?, ?)',
            [req.user.userId, property_id, reason, details || null]
        );
        res.status(201).json({ message: 'Report submitted. Thank you.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
