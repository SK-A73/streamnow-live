import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Video, Users, Info } from 'lucide-react';
import LiveBadge from './LiveBadge';

export default function Navbar({ isLive, viewerCount }) {
  const location = useLocation();

  return (
    <header className="navbar-wrapper">
      <div className="container nav-container">
        <Link to="/" className="brand-logo">
          <div className="logo-icon-wrapper">
            <Radio className="logo-icon" size={22} />
          </div>
          <span className="brand-text">
            Stream<span className="brand-highlight">Now</span>
          </span>
        </Link>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <a
            href="/#about"
            className="nav-link"
          >
            <Info size={16} />
            About
          </a>
          <Link
            to="/visitor"
            className={`nav-link ${location.pathname === '/visitor' ? 'active' : ''}`}
          >
            <Users size={16} />
            Watch Live
          </Link>
          <Link
            to="/streamer"
            className={`nav-link ${location.pathname === '/streamer' ? 'active' : ''}`}
          >
            <Video size={16} />
            Broadcast
          </Link>
        </nav>

        <div className="nav-actions">
          <div className="status-indicator-box">
            <LiveBadge isLive={isLive} />
            {isLive && typeof viewerCount === 'number' && (
              <span className="nav-viewers-count">
                <Users size={14} />
                {viewerCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(11, 16, 32, 0.88);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border-color);
          height: 72px;
          display: flex;
          align-items: center;
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
          font-weight: 800;
          font-size: 1.35rem;
          letter-spacing: -0.03em;
        }

        .logo-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .brand-highlight {
          color: var(--secondary);
          margin-left: 1px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: var(--transition);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
        }

        .nav-link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-link.active {
          color: #fff;
          background: rgba(118, 87, 246, 0.15);
          border: 1px solid rgba(118, 87, 246, 0.3);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-indicator-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
        }

        .nav-viewers-count {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
          border-left: 1px solid var(--border-color);
          padding-left: 10px;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
