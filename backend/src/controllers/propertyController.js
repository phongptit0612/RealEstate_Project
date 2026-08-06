const pool = require('../config/db');
const slugify = require('../utils/slugify');
const axios = require('axios');

exports.createProperty = async (req, res) => {
    try {
        const {
            title, description, address, city, zipcode,
            property_type, price_usd, area_sqm, bedrooms, bathrooms,
            video_url, listing_type = 'sale', district_id, direction, features
        } = req.body;
        const owner_id = req.user.userId;

        if (!title || !price_usd) {
            return res.status(400).json({ error: 'Missing required fields: title and price_usd' });
        }

        const full_address = [address, city, zipcode].filter(Boolean).join(', ').trim();
        const final_vid = video_url && video_url.trim() !== '' ? video_url : null;
        const valid_listing_type = ['sale', 'rent'].includes(listing_type) ? listing_type : 'sale';

        let type_id = 1;
        try {
            const [types] = await pool.query('SELECT type_id FROM property_types WHERE name = ?', [property_type]);
            if (types.length > 0) {
                type_id = types[0].type_id;
            } else if (property_type) {
                const [resType] = await pool.query('INSERT INTO property_types (name) VALUES (?)', [property_type]);
                type_id = resType.insertId;
            }
        } catch (e) {
            console.error('Type creation fallback', e);
        }

        const { latitude, longitude } = req.body;

        // Generate unique slug
        let baseSlug = slugify(title) || 'property';
        let slug = baseSlug;
        let counter = 1;
        let isUnique = false;
        while (!isUnique) {
            const [existing] = await pool.query('SELECT property_id FROM properties WHERE slug = ?', [slug]);
            if (existing.length === 0) {
                isUnique = true;
            } else {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        }

        const [result] = await pool.query(
            `INSERT INTO properties
            (owner_id, type_id, district_id, title, slug, description, listing_type, address,
             price_usd, area_m2, bedrooms, bathrooms, video_url, direction, latitude, longitude,
             mod_status, listing_status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'active', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [
                owner_id, type_id, district_id || null,
                title, slug, description, valid_listing_type,
                full_address, price_usd,
                area_sqm || null, bedrooms || null, bathrooms || null,
                final_vid, direction || null, latitude || null, longitude || null
            ]
        );

        const property_id = result.insertId;

        // Save selected features/amenities
        if (features) {
            const featureIds = Array.isArray(features) ? features : JSON.parse(features);
            if (featureIds.length > 0) {
                const featureRows = featureIds.map(fid => [property_id, parseInt(fid)]);
                await pool.query(
                    'INSERT IGNORE INTO property_features (property_id, feature_id) VALUES ?',
                    [featureRows]
                );
            }
        }

        res.status(201).json({ message: 'Property created. Pending admin approval.', property_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyProperties = async (req, res) => {
    try {
        const owner_id = req.user.userId;
        const [properties] = await pool.query(`
            SELECT p.*,
                pt.name as type_name,
                d.name as district_name, d.city_id,
                c.name as city_name,
                (SELECT COUNT(*) FROM recently_viewed rv WHERE rv.property_id = p.property_id) AS view_count,
                (SELECT COUNT(*) FROM favorites f WHERE f.property_id = p.property_id) AS favorites_count,
                (SELECT COUNT(*) FROM messages m JOIN conversations c2 ON m.conversation_id = c2.conversation_id
                 WHERE c2.property_id = p.property_id AND m.sender_id != p.owner_id) AS inquiry_count
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            WHERE p.owner_id = ?
            ORDER BY p.created_at DESC
        `, [owner_id]);

        // Fetch primary images for these properties
        if (properties.length > 0) {
            const propIds = properties.map(p => p.property_id);
            const [images] = await pool.query('SELECT property_id, image_url FROM property_images WHERE property_id IN (?) AND sort_order = 1', [propIds]);

            properties.forEach(p => {
                const img = images.find(i => i.property_id === p.property_id);
                p.primary_image = img ? img.image_url : null;
                p.city = p.city_name || (p.address ? p.address.split(',')[1]?.trim() : 'Unknown');
                p.status = p.listing_status;
            });
        }
        res.json(properties);
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
        if (title !== undefined) {
            if (title !== existing[0].title || !existing[0].slug) {
                let baseSlug = slugify(title) || 'property';
                let slug = baseSlug;
                let counter = 1;
                let isUnique = false;
                while (!isUnique) {
                    const [existingSlug] = await pool.query('SELECT property_id FROM properties WHERE slug = ? AND property_id != ?', [slug, property_id]);
                    if (existingSlug.length === 0) {
                        isUnique = true;
                    } else {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                }
                fields.push('slug = ?');
                values.push(slug);
            }
            fields.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (price_usd !== undefined) {
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
        if (area_sqm !== undefined) { fields.push('area_m2 = ?'); values.push(area_sqm || null); }
        if (bedrooms !== undefined) { fields.push('bedrooms = ?'); values.push(bedrooms || null); }
        if (bathrooms !== undefined) { fields.push('bathrooms = ?'); values.push(bathrooms || null); }
        if (listing_type !== undefined) { fields.push('listing_type = ?'); values.push(listing_type); }
        if (address !== undefined) { fields.push('address = ?'); values.push(address); }
        if (video_url !== undefined) { fields.push('video_url = ?'); values.push(video_url || null); }
        if (req.body.latitude !== undefined) { fields.push('latitude = ?'); values.push(req.body.latitude || null); }
        if (req.body.longitude !== undefined) { fields.push('longitude = ?'); values.push(req.body.longitude || null); }
        if (req.body.direction !== undefined) { fields.push('direction = ?'); values.push(req.body.direction || null); }
        if (req.body.district_id !== undefined) { fields.push('district_id = ?'); values.push(req.body.district_id ? parseInt(req.body.district_id) : null); }

        if (req.body.expires_at !== undefined) {
            const oldExpiresAt = existing[0].expires_at ? new Date(existing[0].expires_at).toISOString().split('T')[0] : '';
            const newExpiresAt = req.body.expires_at ? new Date(req.body.expires_at).toISOString().split('T')[0] : '';

            if (oldExpiresAt !== newExpiresAt) {
                const created = new Date(existing[0].created_at);
                const now = new Date();
                created.setHours(0, 0, 0, 0);
                now.setHours(0, 0, 0, 0);
                const diffTime = now.getTime() - created.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 7) {
                    return res.status(400).json({ error: 'Không thể thay đổi ngày hết hạn sau khi tin đăng đã được tạo quá 7 ngày.' });
                }

                if (req.body.expires_at) {
                    const expiryDate = new Date(req.body.expires_at);
                    expiryDate.setHours(0, 0, 0, 0);
                    if (expiryDate.getTime() === now.getTime()) {
                        fields.push('listing_status = ?');
                        values.push('hidden');
                    }
                }

                fields.push('expires_at = ?');
                values.push(req.body.expires_at ? new Date(req.body.expires_at) : null);
            }
        }

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
        const {
            keyword, city_id, district_id, type_id,
            minPrice, maxPrice, direction, bedrooms, bathrooms,
            listing_type, currency, sort = 'newest'
        } = req.query;

        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 12);
        const offset = (page - 1) * limit;

        let searchMin = parseFloat(minPrice) || 0;
        let searchMax = parseFloat(maxPrice) || 999999999999;

        // Base currency in database column `price_usd` is USD
        const searchCurrency = currency || 'USD';
        if (searchCurrency === 'VND') {
            // If user searches in VND, convert VND filter bounds to USD base for DB query
            if (minPrice) searchMin = parseFloat(minPrice) / 25400;
            if (maxPrice) searchMax = parseFloat(maxPrice) / 25400;
        }

        let queryStr = `
            SELECT p.*, pt.name as type_name, d.name as district_name, c.name as city_name
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            WHERE p.mod_status = 'approved' 
              AND p.listing_status = 'active'
              AND (p.expires_at IS NULL OR p.expires_at > NOW())
        `;
        const params = [];

        if (keyword) {
            queryStr += ` AND (
                MATCH(p.title, p.description) AGAINST(? IN NATURAL LANGUAGE MODE)
                OR p.address LIKE ?
                OR c.name LIKE ?
                OR d.name LIKE ?
            )`;
            const likeKeyword = `%${keyword}%`;
            params.push(keyword, likeKeyword, likeKeyword, likeKeyword);
        }
        if (minPrice || maxPrice) {
            queryStr += ` AND p.price_usd BETWEEN ? AND ?`;
            params.push(searchMin, searchMax);
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
        if (listing_type && ['sale', 'rent'].includes(listing_type)) {
            queryStr += ` AND p.listing_type = ?`;
            params.push(listing_type);
        }
        if (req.query.features) {
            const featureIds = req.query.features.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (featureIds.length > 0) {
                queryStr += ` AND EXISTS (SELECT 1 FROM property_features pf WHERE pf.property_id = p.property_id AND pf.feature_id IN (?))`;
                params.push(featureIds);
            }
        }

        // Check if vip_tier column exists before using it (safe fallback)
        const [cols] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'vip_tier'`
        );
        const hasVip = cols.length > 0;
        // Safe whitelist of user-selectable sort options
        const sortMap = {
            newest: 'p.created_at DESC',
            oldest: 'p.created_at ASC',
            price_asc: 'p.price_usd ASC',
            price_desc: 'p.price_usd DESC',
            area_asc: 'p.area_m2 ASC',
            area_desc: 'p.area_m2 DESC',
        };
        const sortClause = sortMap[sort] || 'p.created_at DESC';
        const orderClause = hasVip
            ? `ORDER BY CASE p.vip_tier WHEN 'gold' THEN 0 WHEN 'silver' THEN 1 ELSE 2 END ASC, ${sortClause}`
            : `ORDER BY ${sortClause}`;

        // COUNT for pagination total
        const countQuery = `SELECT COUNT(*) as total FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            ${queryStr.substring(queryStr.indexOf('WHERE'))}`;
        const [countRows] = await pool.query(countQuery.replace('SELECT COUNT(*) as total FROM properties p', 'SELECT COUNT(*) as total FROM properties p'), params);
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Paginated data query
        const dataQuery = `SELECT p.*, pt.name as type_name, d.name as district_name, c.name as city_name
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            ${queryStr.substring(queryStr.indexOf('WHERE'))}
            ${orderClause}
            LIMIT ? OFFSET ?`;

        const [properties] = await pool.query(dataQuery, [...params, limit, offset]);

        // Map primary image array
        if (properties.length > 0) {
            const propIds = properties.map(p => p.property_id);
            const [images] = await pool.query('SELECT property_id, image_url FROM property_images WHERE property_id IN (?) AND sort_order = 1', [propIds]);

            properties.forEach(p => {
                const img = images.find(i => i.property_id === p.property_id);
                p.primary_image = img ? img.image_url : null;
            });
        }

        res.json({ properties, total, page, totalPages });
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

// PATCH /api/properties/:property_id/status — Owner: change listing_status (active/sold/rented/hidden/etc)
exports.updatePropertyStatus = async (req, res) => {
    try {
        const { property_id } = req.params;
        const owner_id = req.user.userId;
        const { status } = req.body;

        const VALID_STATUSES = ['active', 'negotiating', 'deposited', 'sold', 'rented', 'hidden'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const [result] = await pool.query(
            'UPDATE properties SET listing_status = ?, updated_at = NOW() WHERE property_id = ? AND owner_id = ?',
            [status, property_id, owner_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Property not found or not owned by you' });
        }

        res.json({ message: `Listing status updated to "${status}"`, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/properties/:property_id/renew — extend expires_at by 7 days
exports.renewListing = async (req, res) => {
    try {
        const { property_id } = req.params;
        const owner_id = req.user.userId;

        // Only the owner can renew
        const [rows] = await pool.query(
            'SELECT property_id, expires_at FROM properties WHERE property_id = ? AND owner_id = ?',
            [property_id, owner_id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Property not found or unauthorized' });

        // Extend from today or current expiry — whichever is later
        await pool.query(
            `UPDATE properties
             SET expires_at = DATE_ADD(GREATEST(IFNULL(expires_at, NOW()), NOW()), INTERVAL 7 DAY),
                 updated_at = NOW()
             WHERE property_id = ? AND owner_id = ?`,
            [property_id, owner_id]
        );

        const [updated] = await pool.query('SELECT expires_at FROM properties WHERE property_id = ?', [property_id]);
        res.json({ message: 'Listing renewed for 7 days', expires_at: updated[0].expires_at });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/properties/:id/images — Owner-only: get all images for their listing
exports.getMyPropertyImages = async (req, res) => {
    try {
        const { id } = req.params;
        const owner_id = req.user.userId;
        const [[prop]] = await pool.query(
            'SELECT property_id FROM properties WHERE property_id = ? AND owner_id = ?',
            [id, owner_id]
        );
        if (!prop) return res.status(403).json({ error: 'Not authorized' });
        const [images] = await pool.query(
            'SELECT image_id, image_url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
            [id]
        );
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/properties/recently-viewed — last 10 properties the user visited
exports.getRecentlyViewed = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const [rows] = await pool.query(`
            SELECT p.property_id, p.title, p.slug, p.price_usd, p.listing_type,
                   p.bedrooms, p.bathrooms, p.area_m2,
                   pt.name as type_name, d.name as district_name, c.name as city_name,
                   rv.viewed_at,
                   (SELECT image_url FROM property_images pi2
                    WHERE pi2.property_id = p.property_id AND pi2.sort_order = 1 LIMIT 1) AS primary_image
            FROM recently_viewed rv
            JOIN properties p ON rv.property_id = p.property_id
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            WHERE rv.user_id = ? AND p.mod_status = 'approved'
            ORDER BY rv.viewed_at DESC
            LIMIT 20
        `, [user_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSearchMetadata = async (req, res) => {
    try {
        const [cities] = await pool.query('SELECT city_id, name FROM cities WHERE is_active = TRUE ORDER BY name');
        const [districts] = await pool.query('SELECT district_id, city_id, name FROM districts WHERE is_active = TRUE ORDER BY name');
        const [types] = await pool.query('SELECT type_id, name FROM property_types WHERE is_active = TRUE ORDER BY name');
        const [features] = await pool.query('SELECT feature_id, name, icon_name FROM features ORDER BY name');
        res.json({ cities, districts, types, features });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/properties/:id  — Full detail page data
exports.getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);
        const queryField = isNumeric ? 'p.property_id' : 'p.slug';

        // Main property data with joins
        const [rows] = await pool.query(`
            SELECT p.*,
                   pt.name as type_name,
                   d.name as district_name, d.zipcode,
                   c.name as city_name, c.country,
                   u.user_id as seller_id, u.full_name as seller_name,
                   u.email as seller_email, u.phone as seller_phone, u.avatar_url as seller_avatar,
                   COALESCE(rev.avg_rating, 0) AS seller_avg_rating,
                   COALESCE(rev.review_count, 0) AS seller_review_count
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            JOIN users u ON p.owner_id = u.user_id
            LEFT JOIN (
                SELECT reviewee_id, AVG(rating) AS avg_rating, COUNT(review_id) AS review_count
                FROM reviews
                GROUP BY reviewee_id
            ) rev ON u.user_id = rev.reviewee_id
            WHERE ${queryField} = ? AND p.mod_status = 'approved'
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });

        const property = rows[0];
        const propId = property.property_id;

        // All images
        const [images] = await pool.query(
            'SELECT image_url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order ASC',
            [propId]
        );

        // Features/tags
        const [features] = await pool.query(`
            SELECT f.feature_id, f.name, f.icon_name
            FROM property_features pf
            JOIN features f ON pf.feature_id = f.feature_id
            WHERE pf.property_id = ?
        `, [propId]);

        // Price history (last 10 changes)
        const [priceHistory] = await pool.query(
            'SELECT old_price_usd, new_price_usd, changed_at FROM price_history WHERE property_id = ? ORDER BY changed_at DESC LIMIT 10',
            [propId]
        );

        // Track recently viewed (fire-and-forget, only if auth token present)
        // We don't block the response for this
        const authHeader = req.cookies?.jwt;
        if (authHeader) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
                pool.query(
                    'INSERT INTO recently_viewed (user_id, property_id, viewed_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE viewed_at = NOW()',
                    [decoded.userId, propId]
                ).catch(() => { });
            } catch (_) { }
        }

        // Track view count from recently_viewed
        const [[{ view_count }]] = await pool.query(
            'SELECT COUNT(*) as view_count FROM recently_viewed WHERE property_id = ?', [propId]
        );
        const [[{ favorites_count }]] = await pool.query(
            'SELECT COUNT(*) as favorites_count FROM favorites WHERE property_id = ?', [propId]
        );

        res.json({ ...property, images, features, priceHistory, view_count, favorites_count });
    } catch (error) {
        console.error('Property detail error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/properties/:id/similar — 4 listings with same type in same city
exports.getSimilarProperties = async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);
        const queryField = isNumeric ? 'p.property_id' : 'p.slug';
        const [[base]] = await pool.query(
            `SELECT p.property_id, p.type_id, p.listing_type, d.city_id, p.district_id 
             FROM properties p 
             LEFT JOIN districts d ON p.district_id = d.district_id 
             WHERE ${queryField} = ?`, [id]
        );
        if (!base) return res.json([]);

        const [similar] = await pool.query(`
            SELECT p.property_id, p.title, p.slug, p.price_usd, p.listing_type, p.bedrooms, p.area_m2,
                   pt.name as type_name, d.name as district_name, c.name as city_name,
                   (SELECT image_url FROM property_images pi2
                    WHERE pi2.property_id = p.property_id AND pi2.sort_order = 1 LIMIT 1) AS primary_image
            FROM properties p
            LEFT JOIN property_types pt ON p.type_id = pt.type_id
            LEFT JOIN districts d ON p.district_id = d.district_id
            LEFT JOIN cities c ON d.city_id = c.city_id
            WHERE p.property_id != ?
              AND p.mod_status = 'approved'
              AND p.listing_status = 'active'
              AND (p.expires_at IS NULL OR p.expires_at > NOW())
              AND p.listing_type = ?
              AND (p.type_id = ? OR d.city_id <=> ?)
            ORDER BY 
              (p.district_id = ? AND p.type_id = ?) DESC,
              (d.city_id <=> ? AND p.type_id = ?) DESC,
              (d.city_id <=> ?) DESC,
              (p.type_id = ?) DESC,
              p.vip_tier = 'gold' DESC, 
              p.vip_tier = 'silver' DESC, 
              p.created_at DESC
            LIMIT 4
        `, [
            base.property_id,
            base.listing_type,
            base.type_id,
            base.city_id,
            base.district_id,
            base.type_id,
            base.city_id,
            base.type_id,
            base.city_id,
            base.type_id
        ]);

        res.json(similar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.geocodeAddress = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.json([]);
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
            try {
                // Call Google Geocoding API
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${apiKey}&language=vi`;
                const response = await axios.get(url);
                
                if (response.data && response.data.status === 'OK') {
                    const results = response.data.results.map(item => ({
                        lat: item.geometry.location.lat,
                        lon: item.geometry.location.lng,
                        display_name: item.formatted_address
                    }));
                    return res.json(results);
                } else if (response.data && response.data.status === 'ZERO_RESULTS') {
                    return res.json([]);
                }
                // If Google fails, log and fallback to Nominatim
                console.warn(`Google Geocoding API returned status: ${response.data.status}. Details:`, JSON.stringify(response.data), `Falling back to Nominatim.`);

            } catch (googleError) {
                console.error('Google Geocoding API error. Falling back to Nominatim:', googleError.message);
            }
        }

        // Fallback: OpenStreetMap Nominatim
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=vn`;
        const response = await axios.get(fallbackUrl, {
            headers: {
                'Accept-Language': 'vi,en',
                'User-Agent': 'LuxEstatesGeocodingProxy/1.0'
            }
        });
        const results = (response.data || []).map(item => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name
        }));
        res.json(results);
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.reverseGeocodeCoordinates = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Missing latitude or longitude' });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
            try {
                // Call Google Reverse Geocoding API
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=vi`;
                const response = await axios.get(url);
                
                if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
                    return res.json({
                        display_name: response.data.results[0].formatted_address
                    });
                }
                console.warn(`Google Reverse Geocoding API returned status: ${response.data.status}. Details:`, JSON.stringify(response.data), `Falling back to Nominatim.`);

            } catch (googleError) {
                console.error('Google Reverse Geocoding error. Falling back to Nominatim:', googleError.message);
            }
        }

        // Fallback: OpenStreetMap Nominatim Reverse
        const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const response = await axios.get(fallbackUrl, {
            headers: {
                'Accept-Language': 'vi,en',
                'User-Agent': 'LuxEstatesGeocodingProxy/1.0'
            }
        });
        
        if (response.data && response.data.display_name) {
            return res.json({
                display_name: response.data.display_name
            });
        }
        res.json({ display_name: `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}` });
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({ error: error.message });
    }
};
