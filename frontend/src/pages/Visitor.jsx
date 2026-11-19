import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  User,
  Radio,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import LiveBadge from '../components/LiveBadge';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/ChatBox';
import { LiveKitStreamManager } from '../services/livekit';
import socketService from '../services/socket';
import api from '../services/api';

export default function Visitor() {
  // Visitor Identity State
  const [visitorName, setVisitorName] = useState(
    () => sessionStorage.getItem('streamnow_visitor_name') || ''
  );
  const [hasEnteredName, setHasEnteredName] = useState(
    () => Boolean(sessionStorage.getItem('streamnow_visitor_name'))
  );
  const [tempName, setTempName] = useState('');
  const [nameError, setNameError] = useState('');

  // Stream State
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);
  const [streamTitle, setStreamTitle] = useState('Live Broadcast');
  const [streamerName, setStreamerName] = useState('Streamer');
  const [viewerCount, setViewerCount] = useState(0);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatError, setChatError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Refs for media and LiveKit
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const livekitManagerRef = useRef(null);

  if (!livekitManagerRef.current) {
    livekitManagerRef.current = new LiveKitStreamManager();
  }

  // Connect to LiveKit Room as Viewer
  const connectToLiveKit = useCallback(async () => {
    if (!visitorName) return;
    setIsConnecting(true);
    setGeneralError(null);

    try {
      // 1. Fetch visitor token from backend
      const tokenData = await api.getLiveKitToken({
        identity: `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: visitorName,
        role: 'visitor'
      });

      if (!tokenData.token) {
        throw new Error('Failed to obtain visitor token from backend');
      }

      if (!tokenData.isConfigured) {
        setGeneralError(
          'Notice: LiveKit Cloud credentials have not been configured on the backend yet. Live chat is active, but live video requires LiveKit Cloud keys.'
        );
        return;
      }

      // 2. Watch broadcast via LiveKit
      await livekitManagerRef.current.watchBroadcast({
        url: tokenData.livekitUrl,
        token: tokenData.token,
        videoElement: videoRef.current,
        audioElement: audioRef.current,
        onTrackSubscribed: (track) => {
          console.log('Subscribed to stream track:', track.kind);
        },
        onDisconnected: (reason) => {
          console.log('LiveKit room disconnected:', reason);
        }
      });
    } catch (err) {
      console.warn('LiveKit visitor connection notice:', err.message);
      const msg = err.message || '';
      if (msg.includes('invalid API key') || msg.includes('401')) {
        setGeneralError(
          'LiveKit Cloud authentication failed: Invalid API Key. Please verify LiveKit credentials in backend/.env.'
        );
      } else {
        setGeneralError(msg || 'Connecting to stream...');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [visitorName]);

  // Initial stream status check and Socket.IO setup
  useEffect(() => {
    // 1. Initial status fetch
    api.getStreamStatus().then((status) => {
      setIsLive(status.isLive);
      if (status.title) setStreamTitle(status.title);
      if (status.streamerName) setStreamerName(status.streamerName);
      if (typeof status.viewerCount === 'number') setViewerCount(status.viewerCount);

      if (status.isLive && hasEnteredName) {
        connectToLiveKit();
      }
    }).catch(console.warn);

    // 2. Socket.IO listeners
    const socket = socketService.getSocket();

    // If visitor has already entered name, register to viewer count
    if (hasEnteredName && visitorName) {
      socketService.joinViewer({ name: visitorName, role: 'visitor' });
    }

    // Chat history
    socket.on('chat:history', (history) => {
      setMessages(history || []);
    });

    // New chat message
    socket.on('chat:new', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Chat errors
    socket.on('chat:error', (err) => {
      setChatError(err.message || 'Comment error');
      setTimeout(() => setChatError(null), 4000);
    });

    // Viewer count updates
    socket.on('viewer:count', ({ count }) => {
      setViewerCount(count);
    });

    // Stream started
    socket.on('stream:started', (status) => {
      console.log('Streamer went live!');
      setIsLive(true);
      setStreamEnded(false);
      if (status.title) setStreamTitle(status.title);
      if (status.streamerName) setStreamerName(status.streamerName);
      if (hasEnteredName) {
        connectToLiveKit();
      }
    });

    // Stream stopped
    socket.on('stream:stopped', () => {
      console.log('Streamer stopped broadcasting');
      setIsLive(false);
      setStreamEnded(true);
      if (livekitManagerRef.current) {
        livekitManagerRef.current.cleanup();
      }
    });

    // General status update
    socket.on('stream:status', (status) => {
      if (status) {
        setIsLive(status.isLive);
        if (status.title) setStreamTitle(status.title);
        if (status.streamerName) setStreamerName(status.streamerName);
        if (typeof status.viewerCount === 'number') setViewerCount(status.viewerCount);
      }
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:new');
      socket.off('chat:error');
      socket.off('viewer:count');
      socket.off('stream:started');
      socket.off('stream:stopped');
      socket.off('stream:status');
      socketService.leaveViewer();

      if (livekitManagerRef.current) {
        livekitManagerRef.current.cleanup();
      }
    };
  }, [hasEnteredName, visitorName, connectToLiveKit]);

  // Handle entering name
  const handleNameSubmit = (e) => {
    e.preventDefault();
    const cleanName = tempName.trim();
    if (!cleanName) {
      setNameError('Please enter a display name to continue.');
      return;
    }
    if (cleanName.length > 30) {
      setNameError('Name cannot exceed 30 characters.');
      return;
    }

    sessionStorage.setItem('streamnow_visitor_name', cleanName);
    setVisitorName(cleanName);
    setHasEnteredName(true);
    setNameError('');

    // Register with socket
    socketService.joinViewer({ name: cleanName, role: 'visitor' });

    // Connect to LiveKit if stream is currently live
    if (isLive) {
      connectToLiveKit();
    }
  };

  // Send comment
  const handleSendMessage = (messageText) => {
    socketService.sendComment({
      message: messageText,
      senderName: visitorName,
      role: 'visitor'
    });
  };

  return (
    <div className="visitor-page-root">
      {/* Visitor Top Header */}
      <div className="visitor-top-header">
        <div className="container header-inner">
          <div className="header-left">
            <Link to="/" className="btn btn-outline back-btn">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
            <div className="title-area">
              <h1 className="page-title">Watch Live Broadcast</h1>
              <LiveBadge isLive={isLive} />
            </div>
          </div>

          <div className="header-right">
            {hasEnteredName && (
              <div className="visitor-profile-pill">
                <User size={15} />
                <span>{visitorName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container main-content-wrap">
        {/* Notice Banner */}
        {generalError && (
          <div className="notice-banner animate-fade-in">
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        <div className="stream-layout">
          {/* Left Column: Video Player & Stream Details */}
          <div className="video-section">
            <VideoPlayer
              videoRef={videoRef}
              audioRef={audioRef}
              isLive={isLive}
              isConnecting={isConnecting}
              streamTitle={streamTitle}
              streamerName={streamerName}
              viewerCount={viewerCount}
              streamEnded={streamEnded}
              error={generalError}
            />

            {/* Stream Info Card */}
            <div className="stream-info-card">
              <div className="info-main">
                <h2 className="info-title">{streamTitle}</h2>
                <div className="info-meta-row">
                  <span className="host-pill">
                    <Sparkles size={14} />
                    Hosted by {streamerName}
                  </span>
                  <span className="viewers-count-pill">
                    <Users size={14} />
                    {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'} watching
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat Panel */}
          <div className="chat-section">
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              currentRole="visitor"
              currentName={visitorName || 'Visitor'}
              disabled={!hasEnteredName}
              error={chatError}
            />
          </div>
        </div>
      </div>

      {/* Name Input Modal (Blocks until name entered) */}
      {!hasEnteredName && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <div className="modal-icon-badge">
                <User size={22} />
              </div>
              <div>
                <h3 className="modal-heading">Welcome to StreamNow</h3>
                <p className="modal-sub">Enter your name to watch and chat</p>
              </div>
            </div>

            <form onSubmit={handleNameSubmit} className="name-form">
              <div className="modal-form-group">
                <label htmlFor="visitor-name-input">Display Name</label>
                <input
                  id="visitor-name-input"
                  type="text"
                  className="input-field"
                  value={tempName}
                  onChange={(e) => {
                    setTempName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g. Alex, Maria..."
                  maxLength={30}
                  autoFocus
                />
                {nameError && <span className="input-error-msg">{nameError}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-join-stream"
                disabled={!tempName.trim()}
              >
                Join Stream
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .visitor-page-root {
          min-height: calc(100vh - 72px);
          display: flex;
          flex-direction: column;
        }

        .visitor-top-header {
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

        .visitor-profile-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          font-size: 0.88rem;
          color: var(--text-main);
          font-weight: 600;
        }

        .main-content-wrap {
          padding-top: 24px;
          flex: 1;
        }

        .notice-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(118, 87, 246, 0.12);
          border: 1px solid rgba(118, 87, 246, 0.3);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          margin-bottom: 20px;
          color: #C4B5FD;
          font-size: 0.9rem;
        }

        .stream-info-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          margin-top: 16px;
        }

        .info-title {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .info-meta-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .host-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(118, 87, 246, 0.15);
          color: #C4B5FD;
          border: 1px solid rgba(118, 87, 246, 0.3);
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .viewers-count-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .modal-icon-badge {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-heading {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .modal-sub {
          font-size: 0.88rem;
          color: var(--text-muted);
        }

        .name-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .input-error-msg {
          display: block;
          color: #F87171;
          font-size: 0.8rem;
          margin-top: 6px;
        }

        .btn-join-stream {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
