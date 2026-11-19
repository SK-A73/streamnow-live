const fs = require('fs');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');

/**
 * Service for LiveKit Cloud integration, credential validation, and token generation
 */
class LiveKitService {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env');
    this.refreshCredentials();
  }

  refreshCredentials() {
    this.url = (process.env.LIVEKIT_URL || '').trim();
    this.apiKey = (process.env.LIVEKIT_API_KEY || '').trim();
    this.apiSecret = (process.env.LIVEKIT_API_SECRET || '').trim();
  }

  /**
   * Refreshes credentials from process.env if updated dynamically
   */
  getCredentials() {
    this.refreshCredentials();
    return {
      url: this.url,
      apiKey: this.apiKey,
      apiSecret: this.apiSecret
    };
  }

  /**
   * Checks whether real LiveKit credentials have been configured
   */
  isConfigured() {
    const { url, apiKey, apiSecret } = this.getCredentials();
    const isPlaceholderUrl = !url || url.includes('your-project') || url.includes('example.com');
    const isPlaceholderKey = !apiKey || apiKey === 'devkey' || apiKey === 'your_api_key_here';
    const isPlaceholderSecret = !apiSecret || apiSecret === 'secret' || apiSecret === 'your_api_secret_here';
    const isMaskedSecret = Boolean(
      apiSecret && (apiSecret.includes('•') || /^[\*\u2022]+$/.test(apiSecret))
    );

    return Boolean(
      url &&
      apiKey &&
      apiSecret &&
      !isPlaceholderUrl &&
      !isPlaceholderKey &&
      !isPlaceholderSecret &&
      !isMaskedSecret
    );
  }

  /**
   * Updates LiveKit credentials dynamically and persists them to backend/.env
   */
  async updateCredentials({ url, apiKey, apiSecret }) {
    if (!url || !url.trim().startsWith('ws')) {
      throw new Error('Invalid LiveKit URL: must begin with wss:// or ws://');
    }
    if (!apiKey || !apiKey.trim()) {
      throw new Error('LiveKit API Key cannot be empty');
    }
    if (!apiSecret || !apiSecret.trim()) {
      throw new Error('LiveKit API Secret cannot be empty');
    }

    const cleanUrl = url.trim();
    const cleanKey = apiKey.trim();
    const cleanSecret = apiSecret.trim();

    if (cleanSecret.includes('•') || /^[\*\u2022]+$/.test(cleanSecret)) {
      throw new Error(
        'Invalid API Secret: It appears you copied the masked bullet characters (••••••••). In your LiveKit Cloud dashboard, click the "Copy" button or reveal with the eye icon next to Secret Key to copy the real key.'
      );
    }

    // Verify token generation with new credentials
    const testToken = new AccessToken(cleanKey, cleanSecret, { identity: 'test_validation' });
    testToken.addGrant({ room: 'test-room', roomJoin: true });
    await testToken.toJwt();

    // Update in-memory process.env
    process.env.LIVEKIT_URL = cleanUrl;
    process.env.LIVEKIT_API_KEY = cleanKey;
    process.env.LIVEKIT_API_SECRET = cleanSecret;
    this.refreshCredentials();

    // Persist to backend/.env file
    try {
      let envContent = '';
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      const updateOrAppend = (content, key, val) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(content)) {
          return content.replace(regex, `${key}=${val}`);
        } else {
          return `${content.trim()}\n${key}=${val}\n`;
        }
      };

      envContent = updateOrAppend(envContent, 'LIVEKIT_URL', cleanUrl);
      envContent = updateOrAppend(envContent, 'LIVEKIT_API_KEY', cleanKey);
      envContent = updateOrAppend(envContent, 'LIVEKIT_API_SECRET', cleanSecret);

      fs.writeFileSync(this.envPath, envContent, 'utf8');
      console.log('✅ Updated and saved LiveKit credentials to backend/.env');
    } catch (fsErr) {
      console.warn('Could not write credentials to .env file, updated in-memory only:', fsErr.message);
    }

    return {
      success: true,
      livekitUrl: cleanUrl,
      isConfigured: this.isConfigured()
    };
  }

  /**
   * Generates a LiveKit AccessToken for a participant
   * @param {Object} options
   * @param {string} options.identity Unique identifier
   * @param {string} options.name Display name
   * @param {string} options.role 'streamer' or 'visitor'
   * @param {string} options.roomName Target room name
   */
  async generateToken({ identity, name, role = 'visitor', roomName = 'streamnow-main-room' }) {
    const { url, apiKey, apiSecret } = this.getCredentials();

    if (!apiKey || !apiSecret) {
      throw new Error(
        'LiveKit credentials missing. Please configure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.'
      );
    }

    if (apiSecret.includes('•') || /^[\*\u2022]+$/.test(apiSecret)) {
      throw new Error(
        'Invalid LiveKit API Secret: You have saved masked bullet characters (••••••••) instead of the real secret key. Please click the "Copy" icon or eye icon in your LiveKit Cloud dashboard to copy the actual secret.'
      );
    }

    const isStreamer = role === 'streamer';

    // Set token validity (6 hours)
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: name || identity,
      ttl: '6h',
    });

    // Add room permissions grant
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isStreamer,
      canPublishData: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return {
      token: jwt,
      roomName,
      livekitUrl: url || 'wss://your-project.livekit.cloud',
      isConfigured: this.isConfigured()
    };
  }
}

const livekitService = new LiveKitService();

module.exports = livekitService;
