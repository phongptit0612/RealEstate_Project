const pool = require('../config/db');
const Decimal = require('decimal.js');

async function convertToUSD(amountStr, currencyCode) {
    if (currencyCode === 'USD') return amountStr;
    const [rows] = await pool.query('SELECT rate_to_usd FROM exchange_rates WHERE currency_code = ?', [currencyCode]);
    if (rows.length > 0) {
        const amount = new Decimal(amountStr);
        const rate = new Decimal(rows[0].rate_to_usd);
        return amount.dividedBy(rate).toNumber(); 
    }
    return parseFloat(amountStr);
}

function convertToEmbedUrl(url) {
    if (!url) return url;
    try {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
    } catch (e) {
        return url;
    }
    return url;
}

module.exports = { convertToUSD, convertToEmbedUrl };
