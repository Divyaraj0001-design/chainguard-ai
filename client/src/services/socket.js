import { io } from 'socket.io-client';

let socket = null;

const BACKEND_URL = import.meta.env.VITE_API_URL || null;

export function getSocket() {
  if (!socket) {
    // Only attempt real WebSocket connection if backend URL is configured
    const socketURL = BACKEND_URL || '/';

    socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: BACKEND_URL ? 10 : 2,  // Don't retry endlessly if no backend
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true,
    });

    socket.on('connect', () => console.log('[ChainGuard] WebSocket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[ChainGuard] WebSocket disconnected:', reason));
    socket.on('connect_error', (err) => {
      console.warn('[ChainGuard] WebSocket unavailable (demo mode):', err.message);
    });
  }
  return socket;
}

export function isBackendConfigured() {
  return !!BACKEND_URL;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export default getSocket;
