const pool = require('../config/db');

// ─── DASHBOARD STATS ─────────────────────────────────────────
// GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const [[{ total_users }]] = await pool.query(`SELECT COUNT(*) as total_users FROM users`);
        const [[{ total_listings }]] = await pool.query(`SELECT COUNT(*) as total_listings FROM properties`);
        const [[{ pending_listings }]] = await pool.query(`SELECT COUNT(*) as pending_listings FROM properties WHERE mod_status = 'pending'`);
        const [[{ approved_listings }]] = await pool.query(`SELECT COUNT(*) as approved_listings FROM properties WHERE mod_status = 'approved'`);
        const [[{ total_reports }]] = await pool.query(`SELECT COUNT(*) as total_reports FROM reports WHERE status = 'pending'`);
        const [[{ new_users_today }]] = await pool.query(`SELECT COUNT(*) as new_users_today FROM users WHERE DATE(created_at) = CURDATE()`);

        // Recent 7-day listing trend
        const [trend] = await pool.query(`
            SELECT DATE(created_at) as day, COUNT(*) as count
            FROM properties
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        `);

        // Recent 7-day user trend
        const [userTrend] = await pool.query(`
            SELECT DATE(created_at) as day, COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        `);

        res.json({ total_users, total_listings, pending_listings, approved_listings, total_reports, new_users_today, trend, userTrend });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── LISTINGS MANAGEMENT ─────────────────────────────────────
// GET /api/admin/listings?status=pending&page=1
exports.getListings = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];

        let where = 'WHERE 1=1';
        if (status) { where += ' AND p.mod_status = ?'; params.push(status); }

        const [listings] = await pool.query(`
            SELECT p.property_id, p.title, p.price_usd, p.listing_type, p.mod_status, p.listing_status,
                   p.created_at, p.expires_at, u.full_name as owner_name, u.email as owner_email,
                   pt.name as type_name
            FROM properties p
            JOIN users u ON p.owner_id = u.user_id
            JOIN property_types pt ON p.type_id = pt.type_id
            ${where}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM properties p ${where}`, params);

        res.json({ listings, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/admin/listings/:id — Full admin view (ignores mod_status)
exports.getListingById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT p.*,
                   pt.name as type_name,
                   d.name as district_name, d.zipcode,
                   c.name as city_name, c.country,
                   u.user_id as seller_id, u.full_name as seller_name,
                   u.email as seller_email, u.phone as seller_phone
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            JOIN users u ON p.owner_id = u.user_id
            WHERE p.property_id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });
        const property = rows[0];

        const [images] = await pool.query('SELECT image_url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC', [id]);
        const [features] = await pool.query(`
            SELECT f.feature_id, f.name, f.icon_name
            FROM property_features pf
            JOIN features f ON pf.feature_id = f.feature_id
            WHERE pf.property_id = ?
        `, [id]);

        res.json({ ...property, images, features });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/admin/listings/:id — Admin: edit listing content
exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price_usd, listing_type } = req.body;
        await pool.query(
            `UPDATE properties SET title = ?, description = ?, price_usd = ?, listing_type = ?, updated_at = NOW() WHERE property_id = ?`,
            [title, description, parseFloat(price_usd), listing_type, id]
        );
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'edit', 'property', id, 'Admin edited listing content']
        );
        res.json({ message: 'Listing updated.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/admin/listings/:id/approve
exports.approveListing = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`UPDATE properties SET mod_status = 'approved' WHERE property_id = ?`, [id]);

        // Log admin action
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'approve', 'property', id, 'Listing approved']
        );

        // Notify owner
        const [[prop]] = await pool.query(`SELECT owner_id, title FROM properties WHERE property_id = ?`, [id]);
        if (prop) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type) VALUES (?, ?, ?, ?, ?, ?)`,
                [prop.owner_id, 'listing_approved', 'Listing Approved!', `Your listing "${prop.title}" has been approved and is now live.`, id, 'property']
            );
        }

        res.json({ message: 'Listing approved and owner notified.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/admin/listings/:id/reject
exports.rejectListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await pool.query(`UPDATE properties SET mod_status = 'rejected' WHERE property_id = ?`, [id]);

        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'reject', 'property', id, reason || 'No reason provided']
        );

        // Notify owner
        const [[prop]] = await pool.query(`SELECT owner_id, title FROM properties WHERE property_id = ?`, [id]);
        if (prop) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type) VALUES (?, ?, ?, ?, ?, ?)`,
                [prop.owner_id, 'listing_rejected', 'Listing Rejected', `Your listing "${prop.title}" was rejected. Reason: ${reason || 'Does not meet guidelines.'}`, id, 'property']
            );
        }

        res.json({ message: 'Listing rejected and owner notified.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/admin/listings/:id
exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM properties WHERE property_id = ?`, [id]);
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'delete', 'property', id, 'Admin force deleted']
        );
        res.json({ message: 'Listing deleted.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── USERS MANAGEMENT ────────────────────────────────────────
// GET /api/admin/users?search=keyword&page=1
exports.getUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];

        let where = 'WHERE 1=1';
        if (search) {
            where += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [users] = await pool.query(`
            SELECT u.user_id, u.email, u.full_name, u.phone, u.role, u.is_verified, u.is_active,
                   u.created_at,
                   COUNT(p.property_id) as listing_count
            FROM users u
            LEFT JOIN properties p ON u.user_id = p.owner_id
            ${where}
            GROUP BY u.user_id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM users u ${where}`, params);

        res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/admin/users/:id/toggle  — activate/deactivate
exports.toggleUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }
        const [[user]] = await pool.query(`SELECT is_active FROM users WHERE user_id = ?`, [id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const newState = user.is_active ? 0 : 1;
        await pool.query(`UPDATE users SET is_active = ? WHERE user_id = ?`, [newState, id]);
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, newState ? 'activate_user' : 'deactivate_user', 'user', id, '']
        );
        res.json({ message: `User ${newState ? 'activated' : 'deactivated'} successfully.`, is_active: newState });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }
        await pool.query(`DELETE FROM users WHERE user_id = ?`, [id]);
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'delete_user', 'user', id, 'Admin deleted user']
        );
        res.json({ message: 'User deleted.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── REPORTS MANAGEMENT ──────────────────────────────────────
// GET /api/admin/reports
exports.getReports = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [reports] = await pool.query(`
            SELECT r.*, u.full_name as reporter_name, u.email as reporter_email,
                   p.title as property_title
            FROM reports r
            JOIN users u ON r.reporter_id = u.user_id
            JOIN properties p ON r.property_id = p.property_id
            WHERE r.status = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, [status, parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM reports WHERE status = ?`, [status]);

        res.json({ reports, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/admin/reports/:id  — reviewed or dismissed
exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'reviewed' | 'dismissed'
        await pool.query(`UPDATE reports SET status = ? WHERE report_id = ?`, [status, id]);
        res.json({ message: `Report marked as ${status}.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── CATEGORY MANAGEMENT ─────────────────────────────────────
// Cities
exports.getCities = async (req, res) => {
    const [cities] = await pool.query(`SELECT * FROM cities ORDER BY name`);
    res.json(cities);
};
exports.createCity = async (req, res) => {
    try {
        const { name, country } = req.body;
        const [r] = await pool.query(`INSERT INTO cities (name, country) VALUES (?, ?)`, [name, country || 'Vietnam']);
        res.status(201).json({ city_id: r.insertId, name, country: country || 'Vietnam' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.deleteCity = async (req, res) => {
    try {
        await pool.query(`DELETE FROM cities WHERE city_id = ?`, [req.params.id]);
        res.json({ message: 'City deleted.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Districts
exports.getDistricts = async (req, res) => {
    const [districts] = await pool.query(`SELECT d.*, c.name as city_name FROM districts d JOIN cities c ON d.city_id = c.city_id ORDER BY c.name, d.name`);
    res.json(districts);
};
exports.createDistrict = async (req, res) => {
    try {
        const { city_id, name, zipcode } = req.body;
        const [r] = await pool.query(`INSERT INTO districts (city_id, name, zipcode) VALUES (?, ?, ?)`, [city_id, name, zipcode || null]);
        res.status(201).json({ district_id: r.insertId, city_id, name, zipcode });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.deleteDistrict = async (req, res) => {
    try {
        await pool.query(`DELETE FROM districts WHERE district_id = ?`, [req.params.id]);
        res.json({ message: 'District deleted.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Property Types
exports.getPropertyTypes = async (req, res) => {
    const [types] = await pool.query(`SELECT pt.*, parent.name as parent_name FROM property_types pt LEFT JOIN property_types parent ON pt.parent_id = parent.type_id ORDER BY pt.name`);
    res.json(types);
};
exports.createPropertyType = async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const [r] = await pool.query(`INSERT INTO property_types (name, parent_id) VALUES (?, ?)`, [name, parent_id || null]);
        res.status(201).json({ type_id: r.insertId, name, parent_id: parent_id || null });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.deletePropertyType = async (req, res) => {
    try {
        await pool.query(`DELETE FROM property_types WHERE type_id = ?`, [req.params.id]);
        res.json({ message: 'Property type deleted.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Audit Log
exports.getAuditLog = async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT al.*, u.full_name as admin_name
            FROM admin_logs al
            LEFT JOIN users u ON al.admin_id = u.user_id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// ─── FEATURES / AMENITIES MANAGEMENT ─────────────────────────
// GET /api/admin/features
exports.getFeatures = async (req, res) => {
    try {
        const [features] = await pool.query(`SELECT * FROM features ORDER BY name`);
        res.json(features);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// POST /api/admin/features
exports.createFeature = async (req, res) => {
    try {
        const { name, icon_name } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Feature name is required' });
        const [r] = await pool.query(
            `INSERT INTO features (name, icon_name) VALUES (?, ?)`,
            [name.trim(), icon_name?.trim() || null]
        );
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'create_feature', 'feature', r.insertId, `Created feature: ${name}`]
        );
        res.status(201).json({ feature_id: r.insertId, name: name.trim(), icon_name: icon_name?.trim() || null });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// DELETE /api/admin/features/:id
exports.deleteFeature = async (req, res) => {
    try {
        const { id } = req.params;
        // Remove from property_features first (cascade safety)
        await pool.query(`DELETE FROM property_features WHERE feature_id = ?`, [id]);
        await pool.query(`DELETE FROM features WHERE feature_id = ?`, [id]);
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, note) VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, 'delete_feature', 'feature', id, 'Deleted feature/amenity']
        );
        res.json({ message: 'Feature deleted.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
