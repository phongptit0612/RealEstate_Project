const pool = require('../config/db');

exports.createProperty = async (req, res) => {
    try {
        const { title, description, address, city, zipcode, property_type, price_usd, area_sqm, bedrooms, bathrooms, features, video_url } = req.body;
        const owner_id = req.user.userId;

        // Basic verification
        if(!title || !price_usd || !city) {
             return res.status(400).json({ error: 'Missing required fundamental fields' });
        }

        // Map Form data to Strict DB Schema
        const full_address = `${address}, ${city}, ${zipcode}`.trim();
        const final_vid = video_url && video_url.trim() !== '' ? video_url : null;
        
        let type_id = 1;
        try {
            // Find or create property_type dynamically
            const [types] = await pool.query('SELECT type_id FROM property_types WHERE name = ?', [property_type]);
            if (types.length > 0) {
                type_id = types[0].type_id;
            } else {
                const [resType] = await pool.query('INSERT INTO property_types (name) VALUES (?)', [property_type]);
                type_id = resType.insertId;
            }
        } catch (e) {
            console.error("Type creation fallback", e);
        }

        const { latitude, longitude } = req.body;
        const [result] = await pool.query(
            `INSERT INTO properties 
            (owner_id, type_id, title, description, listing_type, address, price_usd, area_m2, bedrooms, bathrooms, video_url, latitude, longitude, mod_status, listing_status, expires_at) 
            VALUES (?, ?, ?, ?, 'sale', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'active', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [owner_id, type_id, title, description, full_address, price_usd, area_sqm || null, bedrooms || null, bathrooms || null, final_vid, latitude || null, longitude || null]
        );

        res.status(201).json({ message: 'Property created. Pending admin approval.', property_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyProperties = async (req, res) => {
    try {
        const owner_id = req.user.userId;
        const [properties] = await pool.query('SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC', [owner_id]);
        
        // Fetch primary images for these properties
        if (properties.length > 0) {
            const propIds = properties.map(p => p.property_id);
            const [images] = await pool.query('SELECT property_id, image_url FROM property_images WHERE property_id IN (?) AND sort_order = 1', [propIds]);
            
            properties.forEach(p => {
                const img = images.find(i => i.property_id === p.property_id);
                p.primary_image = img ? img.image_url : null;
                // Hack to let the UI parse city
                p.city = p.address ? p.address.split(',')[1] || 'Unknown' : 'Unknown';
                p.status = p.listing_status;
            });
        }
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePropertyStatus = async (req, res) => {
    try {
        const { property_id } = req.params;
        const { status } = req.body;
        const owner_id = req.user.userId;
        const [result] = await pool.query(
            'UPDATE properties SET listing_status = ? WHERE property_id = ? AND owner_id = ?',
            [status === 'available' ? 'active' : status, property_id, owner_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Property not found or unauthorized' });
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/properties/:property_id — owner edits their listing
exports.updateProperty = async (req, res) => {
    try {
        const { property_id } = req.params;
        const owner_id = req.user.userId;

        // Confirm ownership first
        const [existing] = await pool.query('SELECT * FROM properties WHERE property_id = ? AND owner_id = ?', [property_id, owner_id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Property not found or unauthorized' });

        const { title, description, price_usd, area_sqm, bedrooms, bathrooms, listing_type, address, video_url } = req.body;

        const fields = [];
        const values = [];
        if (title !== undefined)        { fields.push('title = ?');         values.push(title); }
        if (description !== undefined)  { fields.push('description = ?');   values.push(description); }
        if (price_usd !== undefined)    {
            // Record price history if price changed
            const oldPrice = parseFloat(existing[0].price_usd);
            const newPrice = parseFloat(price_usd);
            if (oldPrice !== newPrice) {
                await pool.query(
                    'INSERT INTO price_history (property_id, old_price_usd, new_price_usd) VALUES (?, ?, ?)',
                    [property_id, oldPrice, newPrice]
                );
            }
            fields.push('price_usd = ?'); values.push(price_usd);
        }
        if (area_sqm !== undefined)     { fields.push('area_m2 = ?');       values.push(area_sqm || null); }
        if (bedrooms !== undefined)     { fields.push('bedrooms = ?');       values.push(bedrooms || null); }
        if (bathrooms !== undefined)    { fields.push('bathrooms = ?');      values.push(bathrooms || null); }
        if (listing_type !== undefined) { fields.push('listing_type = ?');   values.push(listing_type); }
        if (address !== undefined)      { fields.push('address = ?');        values.push(address); }
        if (video_url !== undefined)    { fields.push('video_url = ?');      values.push(video_url || null); }
        if (req.body.latitude !== undefined)  { fields.push('latitude = ?');   values.push(req.body.latitude || null); }
        if (req.body.longitude !== undefined) { fields.push('longitude = ?');  values.push(req.body.longitude || null); }

        // Editing resets mod_status to pending (needs re-approval)
        fields.push('mod_status = ?'); values.push('pending');

        if (fields.length === 1) return res.status(400).json({ error: 'No fields to update' });

        values.push(property_id);
        await pool.query(`UPDATE properties SET ${fields.join(', ')} WHERE property_id = ?`, values);

        res.json({ message: 'Property updated. Pending admin re-approval.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchProperties = async (req, res) => {
    try {
        const { keyword, minPrice, maxPrice, currency='USD', type_id, city_id, district_id, direction, bedrooms, bathrooms } = req.query;

        let usdMin = parseFloat(minPrice) || 0;
        let usdMax = parseFloat(maxPrice) || 999999999999;

        // Currency Scaling logic
        if (currency !== 'USD' && (minPrice || maxPrice)) {
            const [rateRows] = await pool.query('SELECT rate_to_usd FROM exchange_rates WHERE currency_code = ?', [currency]);
            if (rateRows.length > 0) {
                const rate = rateRows[0].rate_to_usd;
                if (minPrice) usdMin = parseFloat(minPrice) * rate;
                if (maxPrice) usdMax = parseFloat(maxPrice) * rate;
            }
        }

        let queryStr = `
            SELECT p.*, pt.name as type_name, d.name as district_name, c.name as city_name
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            WHERE p.mod_status = 'approved' AND p.listing_status = 'active'
        `;
        const params = [];

        if (keyword) {
            queryStr += ` AND MATCH(p.title, p.description) AGAINST(? IN NATURAL LANGUAGE MODE)`;
            params.push(keyword);
        }
        if (minPrice || maxPrice) {
            queryStr += ` AND p.price_usd BETWEEN ? AND ?`;
            params.push(usdMin, usdMax);
        }
        if (type_id) {
            queryStr += ` AND p.type_id = ?`;
            params.push(type_id);
        }
        if (city_id) {
            queryStr += ` AND c.city_id = ?`;
            params.push(city_id);
        }
        if (district_id) {
            queryStr += ` AND p.district_id = ?`;
            params.push(district_id);
        }
        if (direction) {
            queryStr += ` AND p.direction = ?`;
            params.push(direction);
        }
        if (bedrooms) {
            queryStr += ` AND p.bedrooms >= ?`;
            params.push(bedrooms);
        }
        if (bathrooms) {
            queryStr += ` AND p.bathrooms >= ?`;
            params.push(bathrooms);
        }

        // Check if vip_tier column exists before using it (safe fallback if migration not run yet)
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'vip_tier'`
        );
        const hasVip = cols.length > 0;

        if (hasVip) {
            // VIP listings float to top: gold → silver → none; then newest first
            queryStr += ` ORDER BY
                CASE p.vip_tier WHEN 'gold' THEN 0 WHEN 'silver' THEN 1 ELSE 2 END ASC,
                p.created_at DESC LIMIT 50`;
        } else {
            queryStr += ` ORDER BY p.created_at DESC LIMIT 50`;
        }

        const [properties] = await pool.query(queryStr, params);

        // Map primary image array
        if (properties.length > 0) {
            const propIds = properties.map(p => p.property_id);
            const [images] = await pool.query('SELECT property_id, image_url FROM property_images WHERE property_id IN (?) AND sort_order = 1', [propIds]);
            
            properties.forEach(p => {
                const img = images.find(i => i.property_id === p.property_id);
                p.primary_image = img ? img.image_url : null;
            });
        }

        res.json(properties);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const { property_id } = req.params;
        const owner_id = req.user.userId;

        const [result] = await pool.query('DELETE FROM properties WHERE property_id = ? AND owner_id = ?', [property_id, owner_id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Property not found or unauthorized' });
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSearchMetadata = async (req, res) => {
    try {
        const [cities] = await pool.query('SELECT city_id, name FROM cities WHERE is_active = TRUE');
        const [districts] = await pool.query('SELECT district_id, city_id, name FROM districts WHERE is_active = TRUE');
        const [types] = await pool.query('SELECT type_id, name FROM property_types WHERE is_active = TRUE');
        res.json({ cities, districts, types });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/properties/:id  — Full detail page data
exports.getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Main property data with joins
        const [rows] = await pool.query(`
            SELECT p.*,
                   pt.name as type_name,
                   d.name as district_name, d.zipcode,
                   c.name as city_name, c.country,
                   u.user_id as seller_id, u.full_name as seller_name,
                   u.email as seller_email, u.phone as seller_phone, u.avatar_url as seller_avatar
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            JOIN users u ON p.owner_id = u.user_id
            WHERE p.property_id = ? AND p.mod_status = 'approved'
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });

        const property = rows[0];

        // All images
        const [images] = await pool.query(
            'SELECT image_url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
            [id]
        );

        // Features/tags
        const [features] = await pool.query(`
            SELECT f.feature_id, f.name, f.icon_name
            FROM property_features pf
            JOIN features f ON pf.feature_id = f.feature_id
            WHERE pf.property_id = ?
        `, [id]);

        // Price history (last 10 changes)
        const [priceHistory] = await pool.query(
            'SELECT old_price_usd, new_price_usd, changed_at FROM price_history WHERE property_id = ? ORDER BY changed_at DESC LIMIT 10',
            [id]
        );

        // Track recently viewed (fire-and-forget, only if auth token present)
        // We don't block the response for this
        const authHeader = req.cookies?.jwt;
        if (authHeader) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(authHeader, process.env.JWT_SECRET || 'super_secret_jwt_key_you_can_use_anything_in_dev');
                pool.query(
                    'INSERT INTO recently_viewed (user_id, property_id, viewed_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE viewed_at = NOW()',
                    [decoded.userId, id]
                ).catch(() => {});
            } catch (_) {}
        }

        res.json({ ...property, images, features, priceHistory });
    } catch (error) {
        console.error('Property detail error:', error);
        res.status(500).json({ error: error.message });
    }
};
