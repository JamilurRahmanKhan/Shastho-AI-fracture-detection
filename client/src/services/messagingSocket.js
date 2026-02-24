/**
 * Frontend API client: messagingSocket
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side API wrapper for calling ShasthoAI backend endpoints.
 *
 * Project-specific notes:
 * - (none)
 */

import { io } from 'socket.io-client';
import { auth } from '@/firebase/firebase';

// Socket.IO client for Doctor <-> User messaging.
// Dev default points to backend port (5001). In production, set VITE_SOCKET_URL to your API origin.

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

let _socket = null;
let _tokenRefreshing = false;

async function getToken() {
  const u = auth.currentUser;
  if (!u) return null;
  return await u.getIdToken();
}

export async function getMessagingSocket() {
  if (_socket && _socket.connected) return _socket;

  const token = await getToken();
  if (!token) return null;

  if (!_socket) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: { token },
    });

    // If token expires, refresh once and reconnect.
    _socket.on('connect_error', async (err) => {
      const msg = (err?.message || '').toLowerCase();
      if (_tokenRefreshing) return;
      if (msg.includes('unauthorized')) {
        try {
          _tokenRefreshing = true;
          const fresh = await auth.currentUser?.getIdToken(true);
          if (fresh) {
            _socket.auth = { token: fresh };
            _socket.connect();
          }
        } finally {
          _tokenRefreshing = false;
        }
      }
    });
  } else {
    _socket.auth = { token };
  }

  if (!_socket.connected) {
    _socket.connect();
  }

  return _socket;
}

export function disconnectMessagingSocket() {
  if (_socket) {
    _socket.disconnect();
  }
}
