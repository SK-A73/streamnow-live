require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const streamRoutes = require('./routes/streamRoutes');
const livekitRoutes = require('./routes/livekitRoutes');
const setupSocket = require('./socket/socketHandler');
const livekitService = require('./services/livekitService');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration for REST and WebSockets
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, Postman, server-to-server
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.endsWith('.netlify.app')) return true;
  if (origin.endsWith('.onrender.com')) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// API Rate Limiting: 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after a minute.'
  }
});
app.use('/api/', apiLimiter);

// Socket.IO Server configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by Socket.IO CORS policy'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 10000
});

// Provide io instance to express routes
app.set('io', io);

// Mount API routes
app.use('/api/stream', streamRoutes);
app.use('/api/livekit', livekitRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    livekitConfigured: livekitService.isConfigured()
  });
});

// Root / documentation route
app.get('/', (req, res) => {
  res.json({
    name: 'StreamNow Live Streaming API',
    version: '1.0.0',
    endpoints: {
      status: 'GET /api/stream/status',
      startStream: 'POST /api/stream/start',
      stopStream: 'POST /api/stream/stop',
      updateTitle: 'PUT /api/stream/title',
      viewers: 'GET /api/stream/viewers',
      livekitToken: 'POST /api/livekit/token',
      health: 'GET /api/health'
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Initialize real-time Socket.IO events
setupSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 StreamNow Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for live streaming & chat`);
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🎥 LiveKit Configured: ${livekitService.isConfigured() ? 'YES' : 'NO (using defaults)'}`);
  console.log(`===============================================`);
});

// Handle graceful termination
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server, io };
