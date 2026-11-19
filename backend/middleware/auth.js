/**
 * Streamer Authentication Middleware
 * Validates the streamer secret provided either via header (x-streamer-secret)
 * or in the request body.
 */
function verifyStreamerSecret(req, res, next) {
  const secret = req.headers['x-streamer-secret'] || (req.body && req.body.streamerSecret);
  const configuredSecret = process.env.STREAMER_ACCESS_SECRET || 'streamer123';

  if (!secret) {
    return res.status(401).json({
      success: false,
      error: 'Streamer access secret is required. Please provide it in the header or request body.'
    });
  }

  if (secret !== configuredSecret) {
    return res.status(403).json({
      success: false,
      error: 'Invalid streamer access secret. Access denied.'
    });
  }

  next();
}

/**
 * Helper to verify secret without responding (e.g., for Socket.IO or token generation)
 */
function isValidStreamerSecret(secret) {
  const configuredSecret = process.env.STREAMER_ACCESS_SECRET || 'streamer123';
  return Boolean(secret && secret === configuredSecret);
}

module.exports = {
  verifyStreamerSecret,
  isValidStreamerSecret
};
