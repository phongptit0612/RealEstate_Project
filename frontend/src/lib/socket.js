import { io } from 'socket.io-client';

let socket = null;
let currentUserId = null;


export function connectSocket(userId) {
    const id = Number(userId);

    if (socket && currentUserId === id) {
        if (socket.disconnected) socket.connect();
        return socket;
    }

    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
        withCredentials: true,
        auth: { userId: id },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 15000,
        timeout: 10000,
    });

    currentUserId = id;

    socket.on('connect', () => console.log('[Socket] Connected as user', id, '→', socket.id));
    socket.on('connect_error', (err) => console.warn('[Socket] Error:', err.message));
    socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));

    return socket;
}

export function getSocket() {
    return socket;
}


export function disconnectSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        currentUserId = null;
        console.log('[Socket] Disconnected by logout');
    }
}
