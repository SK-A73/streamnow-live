import React from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Square,
  Loader2
} from 'lucide-react';

export default function StreamControls({
  isLive,
  isConnecting,
  cameraEnabled,
  micEnabled,
  onStartLive,
  onStopLive,
  onToggleCamera,
  onToggleMic,
  disabled = false
}) {
  return (
    <div className="stream-controls-container">
      <div className="controls-group media-toggles">
        {/* Camera Toggle Button */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`btn btn-control ${cameraEnabled ? 'btn-active' : 'btn-inactive'}`}
          title={cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
          disabled={disabled}
        >
          {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          <span className="btn-label">{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
        </button>

        {/* Microphone Toggle Button */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`btn btn-control ${micEnabled ? 'btn-active' : 'btn-inactive'}`}
          title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          disabled={disabled}
        >
          {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          <span className="btn-label">{micEnabled ? 'Mic On' : 'Muted'}</span>
        </button>
      </div>

      <div className="controls-group main-actions">
        {/* Live Broadcast Action Button */}
        {!isLive ? (
          <button
            type="button"
            onClick={onStartLive}
            disabled={disabled || isConnecting}
            className="btn btn-primary btn-broadcast-start"
          >
            {isConnecting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Going Live...</span>
              </>
            ) : (
              <>
                <Radio size={20} />
                <span>Start Live Broadcast</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopLive}
            disabled={disabled || isConnecting}
            className="btn btn-danger btn-broadcast-stop"
          >
            {isConnecting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Ending Stream...</span>
              </>
            ) : (
              <>
                <Square size={18} fill="currentColor" />
                <span>Stop Broadcast</span>
              </>
            )}
          </button>
        )}
      </div>

      <style>{`
        .stream-controls-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: var(--bg-card);
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-control {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 10px 16px;
          border-radius: var(--radius-md);
        }

        .btn-control.btn-active {
          background: rgba(118, 87, 246, 0.12);
          border-color: rgba(118, 87, 246, 0.4);
          color: #A78BFA;
        }

        .btn-control.btn-inactive {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
          color: #F87171;
        }

        .btn-broadcast-start {
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 700;
        }

        .btn-broadcast-stop {
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .stream-controls-container {
            flex-direction: column;
            align-items: stretch;
          }

          .controls-group {
            width: 100%;
            justify-content: stretch;
          }

          .controls-group button {
            flex: 1;
          }

          .main-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
