/**
 * StreamNow API Client
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (err) {
    console.error(`API request error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  /**
   * Fetch current live stream status and viewer count
   */
  async getStreamStatus() {
    return request('/api/stream/status');
  },

  /**
   * Start broadcast (requires streamer secret)
   */
  async startStream({ title, streamerSecret, streamerName }) {
    return request('/api/stream/start', {
      method: 'POST',
      body: JSON.stringify({ title, streamerSecret, streamerName })
    });
  },

  /**
   * Stop broadcast (requires streamer secret)
   */
  async stopStream({ streamerSecret }) {
    return request('/api/stream/stop', {
      method: 'POST',
      body: JSON.stringify({ streamerSecret })
    });
  },

  /**
   * Update stream title
   */
  async updateStreamTitle({ title, streamerSecret }) {
    return request('/api/stream/title', {
      method: 'PUT',
      body: JSON.stringify({ title, streamerSecret })
    });
  },

  /**
   * Fetch current viewers list
   */
  async getViewers() {
    return request('/api/stream/viewers');
  },

  /**
   * Fetch LiveKit configuration status
   */
  async getLiveKitConfig() {
    return request('/api/livekit/config');
  },

  /**
   * Save LiveKit credentials from Streamer Dashboard
   */
  async saveLiveKitConfig({ url, apiKey, apiSecret, streamerSecret }) {
    return request('/api/livekit/config', {
      method: 'POST',
      body: JSON.stringify({ url, apiKey, apiSecret, streamerSecret })
    });
  },

  /**
   * Generate LiveKit room access token
   */
  async getLiveKitToken({ identity, name, role, streamerSecret, roomName }) {
    return request('/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ identity, name, role, streamerSecret, roomName })
    });
  },

  /**
   * Health check
   */
  async checkHealth() {
    return request('/api/health');
  }
};

export default api;
