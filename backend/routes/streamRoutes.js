const express = require('express');
const router = express.Router();
const streamState = require('../services/streamState');
const { verifyStreamerSecret } = require('../middleware/auth');

/**
 * GET /api/stream/status
 * Return current stream status, viewer count, and stream info
 */
router.get('/status', (req, res) => {
  const status = streamState.getStatus();
  return res.json({
    success: true,
    ...status
  });
});

/**
 * POST /api/stream/start
 * Start the stream and update its status
 */
router.post('/start', verifyStreamerSecret, (req, res) => {
  const { title, streamerName } = req.body;
  const io = req.app.get('io');

  if (streamState.isLive) {
    return res.status(409).json({
      success: false,
      error: 'A live stream is already in progress.',
      status: streamState.getStatus()
    });
  }

  const updatedStatus = streamState.startStream({
    title,
    streamerName
  });

  // Notify all connected visitors and listeners
  if (io) {
    io.emit('stream:started', updatedStatus);
    io.emit('stream:status', updatedStatus);
  }

  return res.json({
    success: true,
    message: 'Stream started successfully',
    status: updatedStatus
  });
});

/**
 * POST /api/stream/stop
 * Stop the stream and update its status
 */
router.post('/stop', verifyStreamerSecret, (req, res) => {
  const io = req.app.get('io');

  if (!streamState.isLive) {
    return res.json({
      success: true,
      message: 'Stream is already offline',
      status: streamState.getStatus()
    });
  }

  const updatedStatus = streamState.stopStream();

  // Notify all connected visitors
  if (io) {
    io.emit('stream:stopped', updatedStatus);
    io.emit('stream:status', updatedStatus);
  }

  return res.json({
    success: true,
    message: 'Stream stopped successfully',
    status: updatedStatus
  });
});

/**
 * PUT /api/stream/title
 * Update the stream title
 */
router.put('/title', verifyStreamerSecret, (req, res) => {
  const { title } = req.body;
  const io = req.app.get('io');

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Title cannot be empty'
    });
  }

  if (title.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Title cannot exceed 100 characters'
    });
  }

  const updatedStatus = streamState.updateTitle(title);

  if (io) {
    io.emit('stream:status', updatedStatus);
  }

  return res.json({
    success: true,
    message: 'Stream title updated',
    status: updatedStatus
  });
});

/**
 * GET /api/stream/viewers
 * Return current viewer count and list
 */
router.get('/viewers', (req, res) => {
  return res.json({
    success: true,
    count: streamState.getViewerCount(),
    viewers: streamState.getViewersList()
  });
});

module.exports = router;
