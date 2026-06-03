const cron = require('node-cron');
const axios = require('axios');
const pool = require('../config/db');

const fetchExchangeRates = async () => {
    try {
        console.log('Fetching latest exchange rates...');
        const response = await axios.get('https://api.fxratesapi.com/latest');
        const rates = response.data.rates; 

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const [currency, rate] of Object.entries(rates)) {
                await connection.query(
                    `INSERT INTO exchange_rates (currency_code, rate_to_usd) 
                     VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE rate_to_usd = ?`,
                    [currency, rate, rate]
                );
            }
            await connection.commit();
            console.log('Exchange rates updated successfully.');
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Failed to update exchange rates:', error.message);
    }
};

// B7: Expire VIP listings whose vip_expires_at has passed
const expireVipListings = async () => {
    try {
        const [result] = await pool.query(
            `UPDATE properties SET vip_tier = 'none', vip_expires_at = NULL 
             WHERE vip_expires_at IS NOT NULL AND vip_expires_at < NOW()`
        );
        if (result.affectedRows > 0) {
            console.log(`[Cron] Expired VIP status for ${result.affectedRows} listing(s).`);
        }

        // Also mark subscriptions as expired
        await pool.query(
            `UPDATE subscriptions SET status = 'expired' 
             WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()`
        );
    } catch (error) {
        console.error('[Cron] Failed to expire VIP listings:', error.message);
    }
};

const initCron = () => {
    // Run everyday at 00:00 UTC — update exchange rates
    cron.schedule('0 0 * * *', fetchExchangeRates);

    // Run every hour — expire VIP listings
    cron.schedule('0 * * * *', expireVipListings);
};

module.exports = { initCron, fetchExchangeRates, expireVipListings };
