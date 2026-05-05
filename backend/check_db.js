require('dotenv').config({ path: 'frontend/../backend/.env' });
const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'real_estate_db'
    });
    const [cols] = await pool.query("DESCRIBE properties");
    console.log(cols.map(c => c.Field));
    process.exit(0);
}
check();
