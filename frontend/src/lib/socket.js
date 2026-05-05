import { io } from 'socket.io-client';

// True module-level singleton — survives React re-renders and StrictMode double-invocation
let socket = null;
let currentUserId = null;

/**
 * Idempotent connect — safe to call multiple times from multiple components.
 * Only creates a new socket when the userId changes or socket doesn't exist.
 */
export function connectSocket(userId) {
    const id = Number(userId);

    // Already connected for the same user → reuse
    if (socket && currentUserId === id) {
        if (socket.disconnected) socket.connect();
        return socket;
    }

    // Different user → teardown old socket
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    socket = io('http://localhost:5000', {
        withCredentials: true,
        auth: { userId: id },
        // Start with polling (reliable), upgrade to WebSocket after handshake
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

/**
 * Hard disconnect — ONLY call this on user logout, not on component unmount.
 */
export function disconnectSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        currentUserId = null;
        console.log('[Socket] Disconnected by logout');
    }
}
