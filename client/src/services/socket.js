import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000
    });

    socket.on('connect', () => console.log('[ChainGuard] WebSocket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[ChainGuard] WebSocket disconnected:', reason));
    socket.on('connect_error', (err) => console.warn('[ChainGuard] WebSocket error:', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export default getSocket;
