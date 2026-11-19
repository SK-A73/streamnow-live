import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  ArrowLeft,
  Users,
  Clock,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Edit3,
  Check,
  AlertTriangle,
  Key,
  ShieldCheck,
  Sparkles,
  Camera,
  Cloud,
  ExternalLink,
  Settings,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import LiveBadge from '../components/LiveBadge';
import StreamControls from '../components/StreamControls';
import ChatBox from '../components/ChatBox';
import { LiveKitStreamManager } from '../services/livekit';
import socketService from '../services/socket';
import api from '../services/api';

export default function Streamer() {
  // Stream & Broadcast State
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamTitle, setStreamTitle] = useState('My Live Broadcast');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('My Live Broadcast');
  const [viewerCount, setViewerCount] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Hardware Media State
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const [previewActive, setPreviewActive] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatError, setChatError] = useState(null);

  // Authentication & Configuration State
  const [streamerSecret, setStreamerSecret] = useState(
    localStorage.getItem('streamnow_streamer_secret') || 'streamer123'
  );
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showLiveKitModal, setShowLiveKitModal] = useState(false);
  const [streamerName, setStreamerName] = useState(
    localStorage.getItem('streamnow_streamer_name') || 'Streamer'
  );

  // LiveKit Credentials Form State
  const [isLiveKitConfigured, setIsLiveKitConfigured] = useState(false);
  const [lkUrl, setLkUrl] = useState('');
  const [lkApiKey, setLkApiKey] = useState('');
  const [lkApiSecret, setLkApiSecret] = useState('');
  const [isSavingLk, setIsSavingLk] = useState(false);
  const [lkSaveError, setLkSaveError] = useState('');
  const [lkSaveSuccess, setLkSaveSuccess] = useState('');
  const [showSecretText, setShowSecretText] = useState(false);

  // General Notification / Error
  const [errorBanner, setErrorBanner] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Refs
  const videoPreviewRef = useRef(null);
  const livekitManagerRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize LiveKit Manager
  if (!livekitManagerRef.current) {
    livekitManagerRef.current = new LiveKitStreamManager();
  }

  // Duration timer
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setDurationSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  // Check LiveKit configuration on mount
  useEffect(() => {
    api.getLiveKitConfig().then((config) => {
      setIsLiveKitConfigured(config.isConfigured);
      if (config.livekitUrl) {
        setLkUrl(config.livekitUrl);
      }
    }).catch(console.warn);
  }, []);

  // Request webcam preview on initial mount
  const startLocalCameraPreview = useCallback(async () => {
    setPermissionError(null);
    try {
      if (videoPreviewRef.current) {
        const videoTrack = await livekitManagerRef.current.getLocalPreview();
        videoTrack.attach(videoPreviewRef.current);
        setPreviewActive(true);
      }
    } catch (err) {
      console.warn('Camera preview permission error:', err);
      setPermissionError(
        'Camera or microphone access denied. Please click the lock or camera icon in your browser address bar to grant permissions, then reload.'
      );
      setPreviewActive(false);
    }
  }, []);

  useEffect(() => {
    startLocalCameraPreview();

    return () => {
      if (livekitManagerRef.current) {
        livekitManagerRef.current.cleanup();
      }
    };
  }, [startLocalCameraPreview]);

  // Setup Socket.IO connection & listeners
  useEffect(() => {
    const socket = socketService.getSocket();

    // Register as Streamer
    socketService.joinViewer({ name: streamerName, role: 'streamer' });

    // Listen to chat history
    socket.on('chat:history', (history) => {
      setMessages(history || []);
    });

    // Listen to new comments
    socket.on('chat:new', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Listen to chat errors
    socket.on('chat:error', (err) => {
      setChatError(err.message || 'Chat error');
      setTimeout(() => setChatError(null), 4000);
    });

    // Listen to viewer counts
    socket.on('viewer:count', ({ count }) => {
      setViewerCount(count);
    });

    // Listen to remote stream status updates
    socket.on('stream:status', (status) => {
      if (status) {
        setIsLive(status.isLive);
        if (status.title) {
          setStreamTitle(status.title);
          setTempTitle(status.title);
        }
        if (typeof status.viewerCount === 'number') {
          setViewerCount(status.viewerCount);
        }
      }
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:new');
      socket.off('chat:error');
      socket.off('viewer:count');
      socket.off('stream:status');
    };
  }, [streamerName]);

  // Toggle Camera
  const handleToggleCamera = () => {
    const nextState = !cameraEnabled;
    const result = livekitManagerRef.current.toggleCamera(nextState);
    setCameraEnabled(result);
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    const nextState = !micEnabled;
    const result = livekitManagerRef.current.toggleMicrophone(nextState);
    setMicEnabled(result);
  };

  // Start Live Functionality
  const handleStartLive = async () => {
    setErrorBanner(null);
    setPermissionError(null);

    // Guard: Check if LiveKit Cloud credentials have been configured
    if (!isLiveKitConfigured) {
      setErrorBanner(
        'LiveKit Cloud credentials are required for live video streaming. Please configure your LiveKit URL and Keys below.'
      );
      setShowLiveKitModal(true);
      return;
    }

    setIsConnecting(true);

    try {
      // 1. Get LiveKit access token from backend
      const tokenResponse = await api.getLiveKitToken({
        identity: `streamer_${Date.now()}`,
        name: streamerName,
        role: 'streamer',
        streamerSecret
      });

      if (!tokenResponse.token) {
        throw new Error('Failed to retrieve LiveKit authentication token.');
      }

      if (!tokenResponse.isConfigured) {
        setIsLiveKitConfigured(false);
        setShowLiveKitModal(true);
        throw new Error(
          'LiveKit Cloud credentials are not configured in backend/.env. Please enter your LiveKit Cloud keys.'
        );
      }

      // 2. Connect to LiveKit Room and publish tracks
      await livekitManagerRef.current.startBroadcast({
        url: tokenResponse.livekitUrl,
        token: tokenResponse.token,
        videoElement: videoPreviewRef.current
      });

      // 3. Mark stream as LIVE in backend REST API (triggers Socket.IO stream:started)
      await api.startStream({
        title: streamTitle,
        streamerSecret,
        streamerName
      });

      setIsLive(true);
      setSuccessToast('🎉 You are now LIVE! Visitors can watch your broadcast in real time.');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error('Error starting live stream:', err);

      const msg = err.message || '';
      if (
        msg.includes('invalid token') ||
        msg.includes('invalid API key') ||
        msg.includes('401')
      ) {
        setErrorBanner(
          'LiveKit Cloud Rejected Connection (401 Invalid Token / Secret). Your API Secret does not match your project. Make sure you copied the real secret key instead of masked dots (••••).'
        );
      } else if (msg.includes('could not establish signal connection')) {
        setErrorBanner(
          'LiveKit Signaling Connection Failed. Please check that your LiveKit WebSocket URL and Secret are valid.'
        );
      } else {
        setErrorBanner(
          msg || 'Failed to start live broadcast. Check camera permissions and streamer credentials.'
        );
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Stop Live Functionality
  const handleStopLive = async () => {
    setIsConnecting(true);
    setErrorBanner(null);

    try {
      // 1. Tell backend to stop stream
      await api.stopStream({ streamerSecret });

      // 2. Cleanup LiveKit tracks and disconnect
      livekitManagerRef.current.cleanup();

      setIsLive(false);
      setDurationSeconds(0);

      // Reconnect local preview for offline mode
      setTimeout(() => {
        startLocalCameraPreview();
      }, 500);

      setSuccessToast('Broadcast stopped. Stream is now offline.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Error stopping stream:', err);
      setErrorBanner(err.message || 'Failed to stop stream gracefully.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Save Title
  const handleSaveTitle = async () => {
    if (!tempTitle.trim()) return;
    try {
      setStreamTitle(tempTitle.trim());
      setIsEditingTitle(false);
      if (isLive) {
        await api.updateStreamTitle({
          title: tempTitle.trim(),
          streamerSecret
        });
      }
    } catch (err) {
      console.warn('Failed to update title:', err);
    }
  };

  // Save LiveKit Credentials Handler
  const handleSaveLiveKitConfig = async (e) => {
    e.preventDefault();
    setLkSaveError('');
    setLkSaveSuccess('');

    if (!lkUrl.trim().startsWith('ws')) {
      setLkSaveError('LiveKit URL must start with wss:// (or ws://)');
      return;
    }
    if (!lkApiKey.trim()) {
      setLkSaveError('API Key cannot be empty');
      return;
    }
    if (!lkApiSecret.trim()) {
      setLkSaveError('API Secret cannot be empty');
      return;
    }
    if (lkApiSecret.includes('•') || /^[\*\u2022]+$/.test(lkApiSecret.trim())) {
      setLkSaveError(
        'Warning: You pasted masked bullet characters (••••••••). In your LiveKit Cloud dashboard, click the "Copy" icon button or reveal with the eye icon next to Secret Key to copy the real plaintext key!'
      );
      return;
    }

    setIsSavingLk(true);
    try {
      const res = await api.saveLiveKitConfig({
        url: lkUrl.trim(),
        apiKey: lkApiKey.trim(),
        apiSecret: lkApiSecret.trim(),
        streamerSecret
      });

      setIsLiveKitConfigured(true);
      setLkSaveSuccess('LiveKit Cloud credentials successfully verified and saved!');
      setErrorBanner(null);
      setTimeout(() => {
        setShowLiveKitModal(false);
        setLkSaveSuccess('');
      }, 1500);
    } catch (err) {
      setLkSaveError(err.message || 'Failed to save LiveKit credentials. Check streamer secret or keys.');
    } finally {
      setIsSavingLk(false);
    }
  };

  // Send message as Streamer
  const handleSendMessage = (messageText) => {
    socketService.sendComment({
      message: messageText,
      senderName: streamerName,
      role: 'streamer',
      streamerSecret
    });
  };

  // Format Duration string: HH:MM:SS
  const formatDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="streamer-page-root">
      {/* Streamer Header */}
      <div className="streamer-top-header">
        <div className="container header-inner">
          <div className="header-left">
            <Link to="/" className="btn btn-outline back-btn">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
            <div className="title-area">
              <h1 className="page-title">Streamer Dashboard</h1>
              <span className="live-status-pill">
                <LiveBadge isLive={isLive} />
              </span>
            </div>
          </div>

          <div className="header-right">
            {/* LiveKit Cloud Status Button */}
            <button
              type="button"
              className={`btn ${isLiveKitConfigured ? 'btn-outline' : 'btn-warning-pill'}`}
              onClick={() => setShowLiveKitModal(true)}
              title="Configure LiveKit Cloud credentials"
            >
              <Cloud size={16} />
              <span>{isLiveKitConfigured ? 'LiveKit Cloud: Active' : 'Setup LiveKit Cloud'}</span>
            </button>

            {/* Host Secret Key */}
            <button
              type="button"
              className="btn btn-outline config-btn"
              onClick={() => setShowSecretModal(true)}
              title="Streamer Secret & Host Settings"
            >
              <Key size={16} />
              <span>Host Key: {streamerSecret ? '••••••••' : 'None'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container main-content-wrap">
        {/* Unconfigured LiveKit Warning Banner */}
        {!isLiveKitConfigured && (
          <div className="livekit-alert-banner animate-fade-in">
            <div className="lk-banner-left">
              <Cloud size={24} className="lk-cloud-icon" />
              <div>
                <h4 className="lk-banner-title">LiveKit Cloud Credentials Needed</h4>
                <p className="lk-banner-sub">
                  WebRTC real-time broadcasting requires LiveKit Cloud credentials. Get a free project from LiveKit Cloud and link it below.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary lk-setup-action-btn"
              onClick={() => setShowLiveKitModal(true)}
            >
              <Settings size={16} />
              <span>Configure LiveKit Cloud</span>
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="toast-banner success-toast animate-fade-in">
            <Sparkles size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorBanner && (
          <div className="toast-banner error-toast animate-fade-in">
            <AlertTriangle size={18} />
            <div className="error-banner-content">
              <span>{errorBanner}</span>
              {!isLiveKitConfigured && (
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => setShowLiveKitModal(true)}
                >
                  Configure Keys Now →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Permission Denied Notice */}
        {permissionError && (
          <div className="permission-alert animate-fade-in">
            <div className="alert-icon-col">
              <Camera size={24} />
            </div>
            <div className="alert-text-col">
              <h4>Camera / Microphone Access Required</h4>
              <p>{permissionError}</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-retry-cam"
              onClick={startLocalCameraPreview}
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Two-Column Stream Layout */}
        <div className="stream-layout">
          {/* Left Column: Video Broadcast & Controls & Metadata */}
          <div className="video-section">
            {/* Stream Title Bar */}
            <div className="stream-title-card">
              {isEditingTitle ? (
                <div className="title-edit-form">
                  <input
                    type="text"
                    className="input-field title-input"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    maxLength={80}
                    placeholder="Enter broadcast title..."
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-save-title"
                    onClick={handleSaveTitle}
                  >
                    <Check size={16} />
                    <span>Save</span>
                  </button>
                </div>
              ) : (
                <div className="title-display-row">
                  <div className="title-text-group">
                    <h2 className="current-stream-title">{streamTitle}</h2>
                    <span className="streamer-host-label">Broadcasting as {streamerName}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline edit-title-btn"
                    onClick={() => {
                      setTempTitle(streamTitle);
                      setIsEditingTitle(true);
                    }}
                    title="Edit stream title"
                  >
                    <Edit3 size={15} />
                    <span>Edit Title</span>
                  </button>
                </div>
              )}
            </div>

            {/* Video Preview Box */}
            <div className="video-preview-wrapper">
              <div className="video-aspect-box">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className={`preview-video ${cameraEnabled ? 'visible' : 'hidden'}`}
                />

                {/* If Camera is Disabled */}
                {!cameraEnabled && (
                  <div className="camera-off-overlay">
                    <VideoOff size={44} />
                    <p>Camera is currently turned off</p>
                  </div>
                )}

                {/* Video Badges Overlay */}
                <div className="video-badges-overlay">
                  <LiveBadge isLive={isLive} />
                  {isLive && (
                    <div className="duration-badge">
                      <Clock size={13} />
                      <span>{formatDuration(durationSeconds)}</span>
                    </div>
                  )}
                  <div className="viewers-count-badge">
                    <Users size={14} />
                    <span>{viewerCount} watching</span>
                  </div>
                </div>

                {/* Bottom Status bar inside video */}
                <div className="video-bottom-strip">
                  <div className="status-indicators">
                    <span className={`status-pill ${cameraEnabled ? 'active' : 'inactive'}`}>
                      {cameraEnabled ? <Video size={13} /> : <VideoOff size={13} />}
                      {cameraEnabled ? 'Camera Active' : 'Camera Off'}
                    </span>
                    <span className={`status-pill ${micEnabled ? 'active' : 'inactive'}`}>
                      {micEnabled ? <Mic size={13} /> : <MicOff size={13} />}
                      {micEnabled ? 'Microphone Active' : 'Muted'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware & Stream Controls */}
            <StreamControls
              isLive={isLive}
              isConnecting={isConnecting}
              cameraEnabled={cameraEnabled}
              micEnabled={micEnabled}
              onStartLive={handleStartLive}
              onStopLive={handleStopLive}
              onToggleCamera={handleToggleCamera}
              onToggleMic={handleToggleMic}
            />

            {/* Stream Telemetry Card */}
            <div className="telemetry-grid">
              <div className="telemetry-card">
                <div className="telemetry-label">Status</div>
                <div className="telemetry-val">
                  {isLive ? <span className="text-live">LIVE NOW</span> : <span className="text-dim">READY (OFFLINE)</span>}
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-label">Audience Viewers</div>
                <div className="telemetry-val">{viewerCount}</div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-label">Stream Duration</div>
                <div className="telemetry-val">{formatDuration(durationSeconds)}</div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-label">LiveKit SFU</div>
                <div className="telemetry-val font-mono">
                  {isLiveKitConfigured ? 'Connected' : 'Setup Required'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Comments Panel */}
          <div className="chat-section">
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              currentRole="streamer"
              currentName={streamerName}
              disabled={false}
              error={chatError}
            />
          </div>
        </div>
      </div>

      {/* LiveKit Cloud Setup Modal */}
      {showLiveKitModal && (
        <div className="modal-backdrop" onClick={() => setShowLiveKitModal(false)}>
          <div className="modal-content lk-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge lk-icon-badge">
                <Cloud size={24} />
              </div>
              <div>
                <h3 className="modal-heading">LiveKit Cloud Configuration</h3>
                <p className="modal-sub">Real-Time WebRTC Media Infrastructure</p>
              </div>
            </div>

            <div className="lk-instructions-card">
              <p className="lk-inst-header">How to obtain free LiveKit Cloud credentials:</p>
              <ol className="lk-steps-list">
                <li>
                  Sign up for a free account at{' '}
                  <a
                    href="https://cloud.livekit.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lk-link"
                  >
                    cloud.livekit.io <ExternalLink size={12} />
                  </a>{' '}
                  (Free tier, zero credit card required).
                </li>
                <li>Create a new project (e.g. <strong>StreamNow</strong>).</li>
                <li>
                  Go to <strong>Settings → Keys</strong>. Click the <strong>Copy icon button</strong> next to API Key, and the <strong>Copy icon button</strong> next to API Secret. <em>(Do not highlight the masked dots)</em>.
                </li>
              </ol>
            </div>

            {lkSaveError && (
              <div className="toast-banner error-toast animate-fade-in" style={{ marginBottom: '14px' }}>
                <AlertTriangle size={16} />
                <span>{lkSaveError}</span>
              </div>
            )}

            {lkSaveSuccess && (
              <div className="toast-banner success-toast animate-fade-in" style={{ marginBottom: '14px' }}>
                <CheckCircle size={16} />
                <span>{lkSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveLiveKitConfig} className="lk-config-form">
              <div className="modal-form-group">
                <label>LiveKit WebSocket URL</label>
                <input
                  type="text"
                  className="input-field"
                  value={lkUrl}
                  onChange={(e) => setLkUrl(e.target.value)}
                  placeholder="wss://your-project.livekit.cloud"
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>LiveKit API Key</label>
                <input
                  type="text"
                  className="input-field"
                  value={lkApiKey}
                  onChange={(e) => setLkApiKey(e.target.value)}
                  placeholder="e.g. APIn6B..."
                  required
                />
              </div>

              <div className="modal-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>LiveKit API Secret</label>
                  <button
                    type="button"
                    onClick={() => setShowSecretText(!showSecretText)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {showSecretText ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showSecretText ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <input
                  type={showSecretText ? 'text' : 'password'}
                  className="input-field"
                  value={lkApiSecret}
                  onChange={(e) => setLkApiSecret(e.target.value)}
                  placeholder="Paste plaintext secret here (not bullets)..."
                  required
                />
                <span className="field-hint" style={{ color: '#FCD34D' }}>
                  ⚠️ Do NOT copy the masked dots (••••). In LiveKit Cloud, click the <strong>Copy icon</strong> button next to API Secret to copy the real key.
                </span>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowLiveKitModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingLk}
                >
                  {isSavingLk ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <span>Save & Enable LiveKit Cloud</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Streamer Secret Configuration Modal */}
      {showSecretModal && (
        <div className="modal-backdrop" onClick={() => setShowSecretModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge">
                <Key size={20} />
              </div>
              <div>
                <h3 className="modal-heading">Host Credentials</h3>
                <p className="modal-sub">Streamer authentication settings</p>
              </div>
            </div>

            <p className="modal-description">
              The Streamer Secret authenticates your broadcasting permissions on the backend and prevents visitors from publishing or stopping your broadcast.
            </p>

            <div className="modal-form-group">
              <label>Host Display Name</label>
              <input
                type="text"
                className="input-field"
                value={streamerName}
                onChange={(e) => {
                  setStreamerName(e.target.value);
                  localStorage.setItem('streamnow_streamer_name', e.target.value);
                }}
                placeholder="Streamer"
              />
            </div>

            <div className="modal-form-group">
              <label>Streamer Access Secret</label>
              <input
                type="password"
                className="input-field"
                value={streamerSecret}
                onChange={(e) => {
                  setStreamerSecret(e.target.value);
                  localStorage.setItem('streamnow_streamer_secret', e.target.value);
                }}
                placeholder="Enter secret (default: streamer123)"
              />
              <span className="field-hint">
                Default for testing: <code>streamer123</code> (configured in backend .env)
              </span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowSecretModal(false)}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .streamer-page-root {
          min-height: calc(100vh - 72px);
          display: flex;
          flex-direction: column;
        }

        .streamer-top-header {
          background: rgba(15, 22, 41, 0.5);
          border-bottom: 1px solid var(--border-color);
          padding: 16px 0;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-warning-pill {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #FDE68A;
          font-size: 0.85rem;
          padding: 8px 14px;
        }

        .btn-warning-pill:hover {
          background: rgba(245, 158, 11, 0.25);
        }

        .back-btn {
          padding: 8px 14px;
          font-size: 0.88rem;
        }

        .title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title {
          font-size: 1.35rem;
          margin: 0;
        }

        .config-btn {
          font-size: 0.85rem;
          padding: 8px 14px;
        }

        .main-content-wrap {
          padding-top: 24px;
          flex: 1;
        }

        .livekit-alert-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(118, 87, 246, 0.12) 100%);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          margin-bottom: 20px;
          gap: 16px;
        }

        .lk-banner-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .lk-cloud-icon {
          color: #F59E0B;
          flex-shrink: 0;
        }

        .lk-banner-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 2px;
        }

        .lk-banner-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .lk-setup-action-btn {
          white-space: nowrap;
          padding: 8px 16px;
          font-size: 0.88rem;
        }

        .toast-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          font-size: 0.92rem;
          font-weight: 500;
        }

        .error-banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-link-action {
          background: transparent;
          border: none;
          color: #FFFFFF;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .success-toast {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #6EE7B7;
        }

        .error-toast {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #FCA5A5;
        }

        .permission-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          margin-bottom: 20px;
          color: #FDE68A;
        }

        .alert-icon-col {
          color: var(--warning);
        }

        .alert-text-col h4 {
          font-size: 0.95rem;
          margin-bottom: 2px;
          color: #fff;
        }

        .alert-text-col p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .btn-retry-cam {
          margin-left: auto;
          white-space: nowrap;
          padding: 8px 14px;
        }

        .stream-title-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          margin-bottom: 16px;
        }

        .title-display-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .current-stream-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .streamer-host-label {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .edit-title-btn {
          font-size: 0.82rem;
          padding: 6px 12px;
        }

        .title-edit-form {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .video-preview-wrapper {
          background: #000;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
        }

        .video-aspect-box {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          background: #040711;
        }

        .preview-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1); /* Mirror camera for natural streamer view */
        }

        .preview-video.hidden {
          display: none;
        }

        .camera-off-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #0B1020;
          color: var(--text-muted);
        }

        .video-badges-overlay {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
          pointer-events: none;
        }

        .duration-badge, .viewers-count-badge {
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .video-bottom-strip {
          position: absolute;
          bottom: 12px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
        }

        .status-indicators {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-pill {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 5px;
          backdrop-filter: blur(6px);
        }

        .status-pill.active {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #6EE7B7;
        }

        .status-pill.inactive {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #FCA5A5;
        }

        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .telemetry-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 16px;
        }

        .telemetry-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .telemetry-val {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
        }

        .font-mono {
          font-family: monospace;
          font-size: 0.85rem;
        }

        .text-live {
          color: #EF4444;
        }

        .lk-modal-box {
          max-width: 540px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .modal-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(118, 87, 246, 0.15);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lk-icon-badge {
          background: rgba(36, 184, 213, 0.15);
          color: var(--secondary);
        }

        .modal-heading {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-sub {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .lk-instructions-card {
          background: rgba(15, 22, 41, 0.6);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-bottom: 20px;
          font-size: 0.85rem;
        }

        .lk-inst-header {
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .lk-steps-list {
          padding-left: 20px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .lk-steps-list li {
          margin-bottom: 4px;
        }

        .lk-link {
          color: var(--secondary);
          text-decoration: underline;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .lk-config-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-description {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .modal-form-group {
          margin-bottom: 4px;
        }

        .modal-form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .field-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-top: 5px;
        }

        .field-hint code {
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 5px;
          border-radius: 4px;
          color: #A78BFA;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .telemetry-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .livekit-alert-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .lk-setup-action-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
