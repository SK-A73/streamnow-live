import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Users,
  Radio,
  Sparkles,
  Zap,
  ShieldCheck,
  MessageSquare,
  Globe2,
  ArrowRight
} from 'lucide-react';
import LiveBadge from '../components/LiveBadge';

export default function Home({ isLive, viewerCount, streamTitle }) {
  const navigate = useNavigate();

  return (
    <div className="landing-page-root">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge-pill animate-fade-in">
            <LiveBadge isLive={isLive} />
            <span className="hero-badge-text">
              {isLive
                ? `Active broadcast in progress (${viewerCount} watching)`
                : 'LiveKit Ultra-Low Latency Streaming'}
            </span>
          </div>

          <h1 className="hero-heading animate-fade-in">
            Go Live. Connect. <span className="gradient-text">Share.</span>
          </h1>

          <p className="hero-subtitle animate-fade-in">
            Start your live broadcast or join a live stream and interact in real time.
            Powered by modern WebRTC and interactive real-time communications.
          </p>

          {/* Action Cards: Streamer & Visitor */}
          <div className="cards-grid">
            {/* Card 1: Go as Streamer */}
            <div
              className="action-card streamer-card"
              onClick={() => navigate('/streamer')}
            >
              <div className="card-top-icon streamer-icon-bg">
                <Video size={32} />
              </div>

              <div className="card-content">
                <div className="card-header-row">
                  <h2 className="card-title">Go as Streamer</h2>
                  <span className="role-tag streamer-tag-pill">Host</span>
                </div>
                <p className="card-description">
                  Start broadcasting live using your camera and interact with your audience
                  with studio-grade controls and instant real-time chat.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/streamer');
                }}
              >
                <span>Start Streaming</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Card 2: Go as Visitor */}
            <div
              className="action-card visitor-card"
              onClick={() => navigate('/visitor')}
            >
              <div className="card-top-icon visitor-icon-bg">
                <Users size={32} />
              </div>

              <div className="card-content">
                <div className="card-header-row">
                  <h2 className="card-title">Go as Visitor</h2>
                  <span className="role-tag visitor-tag-pill">
                    {isLive ? 'Live Now' : 'Viewer'}
                  </span>
                </div>
                <p className="card-description">
                  Watch live broadcasts and interact with the streamer through live comments
                  with sub-second latency and smooth playback.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/visitor');
                }}
              >
                <span>Watch Live</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stream Banner if currently live */}
      {isLive && (
        <section className="live-banner-section">
          <div className="container">
            <div className="live-callout-card">
              <div className="callout-left">
                <div className="callout-pulse">
                  <Radio size={24} />
                </div>
                <div>
                  <span className="callout-tag">BROADCASTING NOW</span>
                  <h3 className="callout-title">{streamTitle || 'Live Stream'}</h3>
                </div>
              </div>
              <div className="callout-right">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/visitor')}
                >
                  Tune In ({viewerCount} watching)
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature Highlights / About Section */}
      <section id="about" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built with Cutting-Edge Streaming Tech</h2>
            <p className="section-subtitle">
              Engineered for seamless WebRTC video streaming and instant messaging.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-box">
                <Zap size={24} />
              </div>
              <h3>Sub-Second Latency</h3>
              <p>
                Powered by LiveKit Cloud WebRTC SFU infrastructure ensuring ultra-low delay between the broadcaster and viewers.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <MessageSquare size={24} />
              </div>
              <h3>Real-Time Live Chat</h3>
              <p>
                High-performance Socket.IO comments with XSS sanitization, rate-limiting, and synchronized message delivery.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <ShieldCheck size={24} />
              </div>
              <h3>Secured Token Auth</h3>
              <p>
                Server-side LiveKit JWT generation protecting API keys, with strict role enforcement and access token privileges.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <Globe2 size={24} />
              </div>
              <h3>Universal Compatibility</h3>
              <p>
                Full responsiveness across desktop, tablet, and mobile browsers with automatic video adaptation and fullscreen support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-wrapper">
        <div className="container footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <Radio size={18} />
              <span>StreamNow</span>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} StreamNow. Real-Time Live Streaming Platform.
            </p>
          </div>
          <div className="footer-right">
            <span className="tech-badge">LiveKit Cloud</span>
            <span className="tech-badge">Socket.IO</span>
            <span className="tech-badge">React & Vite</span>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-page-root {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .hero-section {
          padding: 80px 0 60px;
          position: relative;
          background: radial-gradient(circle at 50% 20%, rgba(118, 87, 246, 0.12) 0%, transparent 60%);
        }

        .hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 28px;
        }

        .hero-badge-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .hero-heading {
          font-size: clamp(2.5rem, 5vw, 4.2rem);
          line-height: 1.1;
          margin-bottom: 20px;
          max-width: 800px;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--text-muted);
          max-width: 640px;
          margin-bottom: 50px;
          line-height: 1.6;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
          max-width: 900px;
          width: 100%;
        }

        .action-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 36px 30px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-card);
          position: relative;
          overflow: hidden;
        }

        .action-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        .action-card:hover {
          transform: translateY(-4px);
          border-color: rgba(118, 87, 246, 0.4);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 24px rgba(118, 87, 246, 0.15);
        }

        .card-top-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .streamer-icon-bg {
          background: linear-gradient(135deg, rgba(118, 87, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
          color: #A78BFA;
          border: 1px solid rgba(118, 87, 246, 0.3);
        }

        .visitor-icon-bg {
          background: linear-gradient(135deg, rgba(36, 184, 213, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
          color: #24B8D5;
          border: 1px solid rgba(36, 184, 213, 0.3);
        }

        .card-content {
          flex: 1;
          margin-bottom: 28px;
        }

        .card-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .role-tag {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .streamer-tag-pill {
          background: rgba(118, 87, 246, 0.15);
          color: #A78BFA;
          border: 1px solid rgba(118, 87, 246, 0.3);
        }

        .visitor-tag-pill {
          background: rgba(36, 184, 213, 0.15);
          color: #24B8D5;
          border: 1px solid rgba(36, 184, 213, 0.3);
        }

        .card-description {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.55;
        }

        .card-action-btn {
          width: 100%;
          justify-content: center;
          padding: 12px 20px;
        }

        .live-banner-section {
          padding: 20px 0 40px;
        }

        .live-callout-card {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(118, 87, 246, 0.12) 100%);
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: var(--radius-lg);
          padding: 20px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .callout-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .callout-pulse {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.2);
          color: var(--live-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .callout-tag {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #F87171;
        }

        .callout-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }

        .features-section {
          padding: 60px 0 80px;
          border-top: 1px solid var(--border-color);
          background: rgba(11, 16, 32, 0.6);
        }

        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .section-title {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .section-subtitle {
          color: var(--text-muted);
          font-size: 1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .feature-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .feature-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(118, 87, 246, 0.12);
          color: #A78BFA;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .feature-item h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
        }

        .feature-item p {
          color: var(--text-muted);
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .footer-wrapper {
          border-top: 1px solid var(--border-color);
          padding: 30px 0;
          background: rgba(11, 16, 32, 0.9);
          margin-top: auto;
        }

        .footer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .footer-copy {
          color: var(--text-dim);
          font-size: 0.85rem;
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tech-badge {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 0.78rem;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
        }

        @media (max-width: 868px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
          }

          .live-callout-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .callout-right button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
