import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Radio,
  Home,
  Loader2,
  Tv2
} from 'lucide-react';
import LiveBadge from './LiveBadge';

export default function VideoPlayer({
  videoRef,
  audioRef,
  isLive,
  isConnecting,
  streamTitle,
  streamerName,
  viewerCount,
  streamEnded = false,
  error = null
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsAudioInteraction, setNeedsAudioInteraction] = useState(false);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  const toggleAudioMute = () => {
    if (audioRef && audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
      setNeedsAudioInteraction(false);
    }
  };

  const handleUnmutePrompt = () => {
    if (audioRef && audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(console.warn);
      setIsMuted(false);
      setNeedsAudioInteraction(false);
    }
  };

  return (
    <div className="player-outer-wrapper" ref={containerRef}>
      <div className="player-screen-area">
        {/* Actual Video and Audio elements */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`stream-video-element ${isLive && !streamEnded ? 'visible' : 'hidden'}`}
        />
        <audio ref={audioRef} autoPlay playsInline />

        {/* Loading Overlay */}
        {isConnecting && (
          <div className="player-overlay loading-overlay">
            <Loader2 size={48} className="animate-spin overlay-spinner" />
            <p className="overlay-title">Connecting to live broadcast...</p>
            <p className="overlay-subtitle">Negotiating LiveKit high-definition stream</p>
          </div>
        )}

        {/* Offline Screen */}
        {!isLive && !streamEnded && !isConnecting && (
          <div className="player-overlay offline-overlay">
            <div className="offline-icon-box">
              <Tv2 size={48} />
            </div>
            <h2 className="overlay-title">The streamer is currently offline</h2>
            <p className="overlay-subtitle">
              The broadcast has not started yet. When the streamer goes live, this page will update automatically.
            </p>
            <Link to="/" className="btn btn-outline overlay-home-btn">
              <Home size={18} />
              Return to Home
            </Link>
          </div>
        )}

        {/* Stream Ended Screen */}
        {streamEnded && !isConnecting && (
          <div className="player-overlay ended-overlay">
            <div className="ended-icon-box">
              <Radio size={44} />
            </div>
            <h2 className="overlay-title">Live Stream Ended</h2>
            <p className="overlay-subtitle">
              Thank you for watching! The streamer has concluded this live broadcast.
            </p>
            <Link to="/" className="btn btn-primary overlay-home-btn">
              <Home size={18} />
              Back to Home
            </Link>
          </div>
        )}

        {/* Browser Autoplay Audio Interaction Prompt */}
        {needsAudioInteraction && isLive && (
          <div className="audio-prompt-pill" onClick={handleUnmutePrompt}>
            <VolumeX size={18} />
            <span>Click to Unmute Stream Audio</span>
          </div>
        )}

        {/* Video Overlay Top Bar (when stream is live) */}
        {isLive && !streamEnded && (
          <div className="player-overlay-top">
            <div className="top-badges">
              <LiveBadge isLive={true} />
              {typeof viewerCount === 'number' && (
                <span className="viewers-pill">
                  {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Video Overlay Controls Bar (bottom) */}
        {isLive && !streamEnded && (
          <div className="player-overlay-bottom">
            <div className="bottom-info">
              <span className="bottom-stream-title">{streamTitle || 'Live Stream'}</span>
              <span className="bottom-streamer-name">Host: {streamerName || 'Streamer'}</span>
            </div>

            <div className="bottom-controls">
              <button
                type="button"
                className="player-control-btn"
                onClick={toggleAudioMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                type="button"
                className="player-control-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .player-outer-wrapper {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-card);
          border: 1px solid var(--border-color);
        }

        .player-screen-area {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          background: #060913;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stream-video-element {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #000;
        }

        .stream-video-element.hidden {
          display: none;
        }

        .stream-video-element.visible {
          display: block;
        }

        .player-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          background: radial-gradient(circle at center, #151D30 0%, #0B1020 100%);
          z-index: 10;
        }

        .overlay-spinner {
          color: var(--primary);
          margin-bottom: 20px;
        }

        .offline-icon-box, .ended-icon-box {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .ended-icon-box {
          color: #F87171;
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .overlay-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }

        .overlay-subtitle {
          color: var(--text-muted);
          max-width: 480px;
          font-size: 0.95rem;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .overlay-home-btn {
          padding: 10px 22px;
        }

        .audio-prompt-pill {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.9);
          backdrop-filter: blur(8px);
          color: #fff;
          padding: 8px 18px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          z-index: 25;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
          animation: pulseLive 2s infinite;
        }

        .player-overlay-top {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
          pointer-events: none;
        }

        .top-badges {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .viewers-pill {
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          color: #fff;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .player-overlay-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px 20px 16px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          z-index: 20;
        }

        .bottom-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bottom-stream-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        }

        .bottom-streamer-name {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .bottom-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .player-control-btn {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .player-control-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
