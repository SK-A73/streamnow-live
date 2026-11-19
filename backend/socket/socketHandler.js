const streamState = require('../services/streamState');
const { isValidStreamerSecret } = require('../middleware/auth');

/**
 * Escapes HTML characters to prevent XSS attacks
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Socket.IO Handler
 */
function setupSocket(io) {
  io.on('connection', (socket) => {
    // Per-socket rate limiting tracking
    let lastMessageTime = 0;
    const MIN_INTERVAL_MS = 600; // Minimum time between comments

    // Automatically join the live room
    const room = streamState.roomName;
    socket.join(room);

    // Send immediate initial status to newly connected client
    socket.emit('stream:status', streamState.getStatus());
    socket.emit('viewer:count', { count: streamState.getViewerCount() });
    socket.emit('chat:history', streamState.getRecentMessages());

    /**
     * Request current stream status
     */
    socket.on('stream:status', () => {
      socket.emit('stream:status', streamState.getStatus());
    });

    /**
     * Viewer/Streamer Registration
     */
    socket.on('viewer:join', (data = {}) => {
      const name = data.name ? data.name.trim().slice(0, 30) : 'Anonymous Viewer';
      const role = data.role === 'streamer' ? 'streamer' : 'visitor';

      socket.data.name = name;
      socket.data.role = role;

      if (role === 'streamer') {
        socket.data.isStreamer = true;
        socket.data.isViewer = false;
      } else {
        socket.data.isViewer = true;
        const count = streamState.addViewer(socket.id, { name, role });
        
        // Broadcast updated count and joined notification
        io.to(room).emit('viewer:count', { count });
        io.to(room).emit('viewer:joined', { name, count });
      }
    });

    /**
     * Viewer explicitly leaves
     */
    socket.on('viewer:leave', () => {
      if (socket.data.isViewer) {
        const { viewer, count } = streamState.removeViewer(socket.id);
        socket.data.isViewer = false;
        io.to(room).emit('viewer:count', { count });
        if (viewer) {
          io.to(room).emit('viewer:left', { name: viewer.name, count });
        }
      }
    });

    /**
     * Chat Message Handler
     */
    socket.on('chat:send', (payload = {}) => {
      const now = Date.now();
      
      // Basic rate limiting
      if (now - lastMessageTime < MIN_INTERVAL_MS) {
        socket.emit('chat:error', {
          message: 'You are sending messages too quickly. Please wait a moment.'
        });
        return;
      }

      const { message, senderName, role, streamerSecret } = payload;

      // Validation: Non-empty string
      if (!message || typeof message !== 'string' || !message.trim()) {
        socket.emit('chat:error', { message: 'Comment cannot be empty.' });
        return;
      }

      const trimmed = message.trim();

      // Validation: Max 300 characters
      if (trimmed.length > 300) {
        socket.emit('chat:error', { message: 'Comment cannot exceed 300 characters.' });
        return;
      }

      lastMessageTime = now;

      // Role verification: Verify streamer identity
      let verifiedRole = 'visitor';
      if (role === 'streamer' && isValidStreamerSecret(streamerSecret)) {
        verifiedRole = 'streamer';
      }

      const cleanMessage = sanitizeText(trimmed);
      const cleanName = sanitizeText(senderName || socket.data.name || 'Anonymous');

      const chatItem = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        senderName: cleanName.slice(0, 30),
        role: verifiedRole,
        message: cleanMessage,
        timestamp: new Date().toISOString()
      };

      // Store in memory
      streamState.addMessage(chatItem);

      // Broadcast to everyone in the room (streamer and all visitors)
      io.to(room).emit('chat:new', chatItem);
    });

    /**
     * Handle Disconnect
     */
    socket.on('disconnect', () => {
      if (socket.data.isViewer) {
        const { viewer, count } = streamState.removeViewer(socket.id);
        io.to(room).emit('viewer:count', { count });
        if (viewer) {
          io.to(room).emit('viewer:left', { name: viewer.name, count });
        }
      }

      if (socket.data.isStreamer) {
        // Streamer closed browser or disconnected
        // If stream is live, notify clients
        if (streamState.isLive) {
          console.log(`Streamer socket disconnected: ${socket.id}`);
        }
      }
    });
  });
}

module.exports = setupSocket;
