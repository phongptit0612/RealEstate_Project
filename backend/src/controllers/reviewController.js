const pool = require('../config/db');

// POST /api/reviews
exports.createReview = async (req, res) => {
    try {
        const reviewer_id = req.user.userId;
        const { reviewee_id, property_id = null, rating, comment = null } = req.body;

        // Check: cannot review yourself
        if (reviewer_id === parseInt(reviewee_id)) {
            return res.status(400).json({ error: 'You cannot write a review for yourself.' });
        }

        // Insert review
        try {
            await pool.query(
                `INSERT INTO reviews (reviewer_id, reviewee_id, property_id, rating, comment)
                 VALUES (?, ?, ?, ?, ?)`,
                [reviewer_id, reviewee_id, property_id, rating, comment]
            );
            
            res.status(201).json({ message: 'Review submitted successfully.' });
        } catch (dbErr) {
            // Check for unique key constraint error (ER_DUP_ENTRY)
            if (dbErr.errno === 1062 || dbErr.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    error: 'You have already submitted a review for this agent/listing.' 
                });
            }
            throw dbErr;
        }
    } catch (error) {
        console.error('[CreateReview] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/reviews/agent/:agentId
exports.getAgentReviews = async (req, res) => {
    try {
        const { agentId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10)); // Default Limit 10
        const offset = (page - 1) * limit;

        // 1. Fetch aggregated stats
        const [[stats]] = await pool.query(
            `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(review_id) AS total_reviews 
             FROM reviews 
             WHERE reviewee_id = ?`,
            [agentId]
        );

        const total = stats.total_reviews;
        const totalPages = Math.ceil(total / limit);

        // 2. Fetch paginated reviews
        const [reviews] = await pool.query(
            `SELECT r.review_id, r.rating, r.comment, r.created_at, r.property_id,
                    u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar,
                    p.title AS property_title
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.user_id
             LEFT JOIN properties p ON r.property_id = p.property_id
             WHERE r.reviewee_id = ?
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [agentId, limit, offset]
        );

        res.json({
            reviews,
            total,
            page,
            totalPages,
            avgRating: parseFloat(stats.avg_rating).toFixed(1),
            totalReviews: total
        });
    } catch (error) {
        console.error('[GetAgentReviews] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/reviews/:review_id
exports.deleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Confirm review exists and user owns it or is an admin
        const [[review]] = await pool.query(
            'SELECT reviewer_id FROM reviews WHERE review_id = ?',
            [review_id]
        );

        if (!review) {
            return res.status(404).json({ error: 'Review not found.' });
        }

        if (review.reviewer_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'You are not authorized to delete this review.' });
        }

        await pool.query('DELETE FROM reviews WHERE review_id = ?', [review_id]);
        res.json({ message: 'Review deleted successfully.' });
    } catch (error) {
        console.error('[DeleteReview] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
