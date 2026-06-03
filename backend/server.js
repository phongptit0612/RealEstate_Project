require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initCron } = require('./src/services/cron');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''));

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isAllowed = allowedOrigins.includes(origin) || 
                              origin.startsWith('http://localhost:');
            if (isAllowed) {
                callback(null, true);
            } else {
                console.warn(`[CORS Blocked Socket.io] Request from origin '${origin}' blocked. Allowed origins:`, allowedOrigins);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

require('./src/sockets/chatSocket')(io);

initCron();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
