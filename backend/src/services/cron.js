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

const initCron = () => {
    // Run everyday at 00:00 UTC
    cron.schedule('0 0 * * *', fetchExchangeRates);
};

module.exports = { initCron, fetchExchangeRates };
