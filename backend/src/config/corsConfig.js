/**
 * Shared CORS origin configuration.
 * Used by both Express (app.js) and Socket.io (server.js) to avoid duplication.
 */

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''));

/**
 * CORS origin checker — allows:
 *  - Origins listed in FRONTEND_URL env var
 *  - Any localhost origin (for local dev)
 *  - Any *.vercel.app origin (for preview deployments)
 *  - Requests with no origin (mobile apps, curl, Postman)
 *
 * @param {string|undefined} origin
 * @param {function} callback
 */
const checkOrigin = (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app');

    if (isAllowed) {
        callback(null, true);
    } else {
        console.warn(`[CORS Blocked] Request from origin '${origin}' blocked. Allowed origins:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'));
    }
};

module.exports = { checkOrigin, allowedOrigins };
