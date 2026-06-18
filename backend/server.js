require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initCron } = require('./src/services/cron');
const { Server } = require('socket.io');
const { checkOrigin } = require('./src/config/corsConfig');
const { checkEmailConfig } = require('./src/utils/emailService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: checkOrigin,
        methods: ["GET", "POST"],
        credentials: true
    }
});

require('./src/sockets/chatSocket')(io);

initCron();

// ── Startup diagnostics ────────────────────────────────────────
checkEmailConfig();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
