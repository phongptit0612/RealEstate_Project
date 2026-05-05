require('dotenv').config();
const mysql = require('mysql2/promise');

async function upgrade() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'real_estate_db',
        });
        
        const [result] = await pool.query("UPDATE users SET role = 'admin' WHERE email = ?", ['ptran4109@gmail.com']);
        
        if (result.affectedRows > 0) {
            console.log(`\nSUCCESS: ptran4109@gmail.com is now officially an Admin!\n`);
        } else {
            console.log(`\nWARNING: User ptran4109@gmail.com was not found in the database. Did you register it yet?\n`);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error connecting to database:', error.message);
        process.exit(1);
    }
}
upgrade();
