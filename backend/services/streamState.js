/**
 * In-Memory Stream State Manager
 */
class StreamStateManager {
  constructor() {
    this.isLive = false;
    this.title = 'Welcome to StreamNow Live Stream!';
    this.streamerName = 'Streamer';
    this.streamerSocketId = null;
    this.roomName = 'streamnow-main-room';
    this.startedAt = null;
    this.viewers = new Map(); // socketId -> { id, name, role, joinedAt }
    this.messages = []; // Array of last 100 messages
    this.maxMessages = 100;
  }

  getStatus() {
    let durationSeconds = 0;
    if (this.isLive && this.startedAt) {
      durationSeconds = Math.floor((Date.now() - new Date(this.startedAt).getTime()) / 1000);
    }

    return {
      isLive: this.isLive,
      title: this.title,
      streamerName: this.streamerName,
      startedAt: this.startedAt,
      durationSeconds,
      viewerCount: this.getViewerCount(),
      roomName: this.roomName
    };
  }

  startStream({ title, streamerName, socketId }) {
    this.isLive = true;
    if (title && title.trim()) {
      this.title = title.trim();
    }
    if (streamerName && streamerName.trim()) {
      this.streamerName = streamerName.trim();
    }
    if (socketId) {
      this.streamerSocketId = socketId;
    }
    this.startedAt = new Date().toISOString();
    return this.getStatus();
  }

  stopStream() {
    this.isLive = false;
    this.startedAt = null;
    this.streamerSocketId = null;
    return this.getStatus();
  }

  updateTitle(newTitle) {
    if (newTitle && newTitle.trim()) {
      this.title = newTitle.trim();
    }
    return this.getStatus();
  }

  addViewer(socketId, viewerInfo) {
    this.viewers.set(socketId, {
      id: viewerInfo.id || socketId,
      name: viewerInfo.name || 'Anonymous Viewer',
      role: viewerInfo.role || 'visitor',
      joinedAt: new Date().toISOString()
    });
    return this.getViewerCount();
  }

  removeViewer(socketId) {
    const viewer = this.viewers.get(socketId);
    this.viewers.delete(socketId);
    return {
      viewer,
      count: this.getViewerCount()
    };
  }

  getViewerCount() {
    return this.viewers.size;
  }

  getViewersList() {
    return Array.from(this.viewers.values());
  }

  addMessage(msg) {
    this.messages.push(msg);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    return msg;
  }

  getRecentMessages() {
    return [...this.messages];
  }
}

// Singleton instance
const streamState = new StreamStateManager();

module.exports = streamState;
