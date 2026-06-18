const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { checkOrigin } = require('./config/corsConfig');

const app = express();

// Trust reverse proxy (e.g. Render, Vercel) for accurate rate limiting IP detection
app.set('trust proxy', 1);

// ── Security Headers ───────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────
app.use(cors({
    origin: checkOrigin,
    credentials: true,
}));

// ── HTTP Request Logging ───────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Compression (gzip) ─────────────────────────────────────────
app.use(compression());

// ── Rate Limiting ──────────────────────────────────────────────
// General auth limiter: 30 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again in 15 minutes.' },
});

// ── Stripe webhook needs raw body BEFORE json parsing ──────────
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscriptions', subscriptionRoutes);

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
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reviews', reviewRoutes);
// Note: /api/subscriptions already mounted above (before express.json for webhook)
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
