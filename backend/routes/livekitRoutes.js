const express = require('express');
const router = express.Router();
const livekitService = require('../services/livekitService');
const { isValidStreamerSecret, verifyStreamerSecret } = require('../middleware/auth');
const streamState = require('../services/streamState');

/**
 * GET /api/livekit/config
 * Returns whether LiveKit Cloud is configured with real credentials
 */
router.get('/config', (req, res) => {
  const isConfigured = livekitService.isConfigured();
  const creds = livekitService.getCredentials();

  return res.json({
    success: true,
    isConfigured,
    livekitUrl: isConfigured ? creds.url : '',
    hasApiKey: Boolean(creds.apiKey && creds.apiKey !== 'devkey' && creds.apiKey !== 'your_api_key_here'),
    message: isConfigured
      ? 'LiveKit Cloud is properly configured.'
      : 'LiveKit Cloud credentials not set or using defaults. Please provide your LiveKit Cloud URL, API Key, and Secret.'
  });
});

/**
 * POST /api/livekit/config
 * Allows authorized streamer to configure LiveKit Cloud credentials dynamically
 */
router.post('/config', verifyStreamerSecret, async (req, res) => {
  try {
    const { url, apiKey, apiSecret } = req.body;

    if (!url || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, apiKey, and apiSecret must all be provided.'
      });
    }

    const result = await livekitService.updateCredentials({
      url,
      apiKey,
      apiSecret
    });

    return res.json({
      success: true,
      message: 'LiveKit credentials successfully configured and verified!',
      isConfigured: result.isConfigured,
      livekitUrl: result.livekitUrl
    });
  } catch (error) {
    console.error('Error updating LiveKit credentials:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update LiveKit credentials'
    });
  }
});

/**
 * POST /api/livekit/token
 * Generate a LiveKit access token with appropriate room permissions
 */
router.post('/token', async (req, res) => {
  try {
    const { identity, name, role = 'visitor', streamerSecret, roomName } = req.body;

    const targetRoom = roomName || streamState.roomName;
    const participantIdentity = identity || `${role}_${Math.random().toString(36).substring(2, 9)}`;
    const participantName = name || participantIdentity;

    // Strict role validation: only allow streamer role if streamer secret is valid
    let verifiedRole = 'visitor';
    if (role === 'streamer') {
      if (!isValidStreamerSecret(streamerSecret)) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: Invalid streamer access secret. You cannot publish without authorization.'
        });
      }
      verifiedRole = 'streamer';
    }

    const isConfigured = livekitService.isConfigured();

    const tokenData = await livekitService.generateToken({
      identity: participantIdentity,
      name: participantName,
      role: verifiedRole,
      roomName: targetRoom
    });

    return res.json({
      success: true,
      identity: participantIdentity,
      name: participantName,
      role: verifiedRole,
      token: tokenData.token,
      roomName: tokenData.roomName,
      livekitUrl: tokenData.livekitUrl,
      isConfigured: tokenData.isConfigured,
      setupRequired: !isConfigured
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate LiveKit access token'
    });
  }
});

module.exports = router;
