import { io } from 'socket.io-client';

const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = RAW_SOCKET_URL.replace(/\/+$/, '');

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to StreamNow Socket server with ID:', this.socket.id);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket server:', reason);
      });
    }

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinViewer({ name, role = 'visitor' }) {
    const s = this.getSocket();
    s.emit('viewer:join', { name, role });
  }

  leaveViewer() {
    if (this.socket) {
      this.socket.emit('viewer:leave');
    }
  }

  sendComment({ message, senderName, role, streamerSecret }) {
    const s = this.getSocket();
    s.emit('chat:send', {
      message,
      senderName,
      role,
      streamerSecret
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
