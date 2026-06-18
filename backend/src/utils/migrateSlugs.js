const pool = require('../config/db');
const slugify = require('./slugify');

async function run() {
    try {
        console.log('[Migration] Checking properties.slug unique index...');
        try {
            await pool.query('ALTER TABLE properties ADD UNIQUE INDEX uq_prop_slug (slug)');
            console.log('[Migration] Unique index uq_prop_slug added successfully.');
        } catch (err) {
            if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME') {
                console.log('[Migration] Unique index uq_prop_slug already exists.');
            } else {
                console.warn('[Migration] Warning adding unique index:', err.message);
            }
        }

        console.log('[Migration] Fetching listings with null/empty slugs...');
        const [rows] = await pool.query("SELECT property_id, title FROM properties WHERE slug IS NULL OR slug = ''");
        console.log(`[Migration] Found ${rows.length} listings to update.`);

        for (const row of rows) {
            let baseSlug = slugify(row.title) || 'property';
            let uniqueSlug = baseSlug;
            let counter = 1;
            let isUnique = false;

            while (!isUnique) {
                // Check if this slug is taken by another property (excluding current property_id)
                const [existing] = await pool.query(
                    'SELECT property_id FROM properties WHERE slug = ? AND property_id != ?',
                    [uniqueSlug, row.property_id]
                );

                if (existing.length === 0) {
                    isUnique = true;
                } else {
                    uniqueSlug = `${baseSlug}-${counter}`;
                    counter++;
                }
            }

            console.log(`[Migration] Updating ID #${row.property_id}: "${row.title}" -> slug: "${uniqueSlug}"`);
            await pool.query('UPDATE properties SET slug = ? WHERE property_id = ?', [uniqueSlug, row.property_id]);
        }

        console.log('[Migration] Completed successfully.');
    } catch (error) {
        console.error('[Migration] Critical failure:', error);
    } finally {
        await pool.end();
    }
}

run();
