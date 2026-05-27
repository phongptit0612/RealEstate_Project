const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.startsWith('http://localhost:') || 
                          origin.endsWith('.vercel.app');
                          
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ── Compression (gzip) ─────────────────────────────────────────
app.use(compression());

// ── Rate Limiting ──────────────────────────────────────────────
// General auth limiter: 20 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again in 15 minutes.' },
});
// Strict login limiter: 8 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, '../../public')));

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth/login', loginLimiter); // extra strict on login
app.use('/api/properties', propertyRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

const pool = require('./config/db');
app.get('/api/rates', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT currency_code, rate_to_usd FROM exchange_rates');
        const rates = {};
        rows.forEach(row => { rates[row.currency_code] = row.rate_to_usd; });
        res.json(rates);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Global Express Error Handler to catch Cloudinary/Multer unhandled object errors
app.use((err, req, res, next) => {
    console.error("Global Error Caught:", err);
    res.status(500).json({ error: err.message || (typeof err === 'object' ? JSON.stringify(err) : "Unknown Internal Error") });
});

module.exports = app;
