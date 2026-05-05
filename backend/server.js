require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initCron } = require('./src/services/cron');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

require('./src/sockets/chatSocket')(io);

initCron();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
