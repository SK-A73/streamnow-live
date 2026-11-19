import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  User,
  ArrowDown
} from 'lucide-react';

export default function ChatBox({
  messages = [],
  onSendMessage,
  currentRole = 'visitor',
  currentName = 'Visitor',
  disabled = false,
  error = null
}) {
  const [inputText, setInputText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const chatListRef = useRef(null);

  const MAX_CHARS = 300;

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (!showScrollBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBottom]);

  // Handle user scroll detection
  const handleScroll = () => {
    if (!chatListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBottom(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length > MAX_CHARS || disabled) return;

    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const remainingChars = MAX_CHARS - inputText.length;
  const isCharWarning = remainingChars <= 30;

  return (
    <div className="chatbox-wrapper">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title-group">
          <MessageSquare size={18} className="chat-header-icon" />
          <h3 className="chat-title">Live Chat</h3>
        </div>
        <span className="chat-count-badge">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="chat-messages-area"
        ref={chatListRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon-circle">
              <MessageSquare size={26} />
            </div>
            <p className="empty-title">No comments yet</p>
            <p className="empty-subtitle">Be the first to join the conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((item) => {
              const isStreamerMsg = item.role === 'streamer';
              const isCurrentUser = item.senderName === currentName;

              return (
                <div
                  key={item.id}
                  className={`chat-item animate-fade-in ${isStreamerMsg ? 'is-streamer' : ''} ${isCurrentUser ? 'is-me' : ''}`}
                >
                  <div className="chat-avatar">
                    {isStreamerMsg ? (
                      <Sparkles size={16} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>

                  <div className="chat-content">
                    <div className="chat-meta">
                      <span className="sender-name">
                        {item.senderName}
                        {isStreamerMsg && (
                          <span className="streamer-tag">STREAMER</span>
                        )}
                        {isCurrentUser && !isStreamerMsg && (
                          <span className="you-tag">YOU</span>
                        )}
                      </span>
                      <span className="chat-timestamp">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="chat-text">{item.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll To Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            className="scroll-bottom-btn"
            onClick={scrollToBottom}
          >
            <ArrowDown size={14} />
            Latest messages
          </button>
        )}
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="chat-error-banner animate-fade-in">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Chat Input Section */}
      <form onSubmit={handleSubmit} className="chat-input-container">
        <div className="input-wrapper">
          <input
            type="text"
            className="chat-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? 'Chat is currently disabled'
                : `Comment as ${currentName}... (Press Enter to send)`
            }
            maxLength={MAX_CHARS}
            disabled={disabled}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={disabled || !inputText.trim()}
            title="Send comment"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Input Footer: Character Counter */}
        <div className="input-footer">
          <span className="rate-limit-hint">Press Enter to send</span>
          <span className={`char-counter ${isCharWarning ? 'warning' : ''}`}>
            {inputText.length} / {MAX_CHARS}
          </span>
        </div>
      </form>

      <style>{`
        .chatbox-wrapper {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 520px;
          overflow: hidden;
          position: relative;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(15, 22, 41, 0.4);
        }

        .chat-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chat-header-icon {
          color: var(--primary);
        }

        .chat-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .chat-count-badge {
          font-size: 0.75rem;
          color: var(--text-dim);
          background: rgba(255, 255, 255, 0.05);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
        }

        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          text-align: center;
          padding: 30px;
        }

        .empty-icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          color: var(--text-dim);
          border: 1px dashed var(--border-color);
        }

        .empty-title {
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .empty-subtitle {
          font-size: 0.85rem;
          color: var(--text-dim);
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          transition: var(--transition);
        }

        .chat-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .chat-item.is-streamer {
          background: rgba(118, 87, 246, 0.09);
          border-color: rgba(118, 87, 246, 0.3);
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .chat-item.is-streamer .chat-avatar {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: #fff;
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .chat-content {
          flex: 1;
          min-width: 0;
        }

        .chat-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .sender-name {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-item.is-streamer .sender-name {
          color: #C4B5FD;
        }

        .streamer-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .you-tag {
          font-size: 0.65rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          padding: 2px 5px;
          border-radius: 4px;
        }

        .chat-timestamp {
          font-size: 0.72rem;
          color: var(--text-dim);
        }

        .chat-text {
          font-size: 0.92rem;
          color: var(--text-main);
          word-break: break-word;
          line-height: 1.4;
        }

        .scroll-bottom-btn {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-card-light);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transition: var(--transition);
        }

        .scroll-bottom-btn:hover {
          background: var(--primary);
        }

        .chat-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.15);
          border-top: 1px solid rgba(239, 68, 68, 0.3);
          border-bottom: 1px solid rgba(239, 68, 68, 0.3);
          color: #FCA5A5;
          padding: 8px 16px;
          font-size: 0.82rem;
        }

        .chat-input-container {
          padding: 14px 16px;
          border-top: 1px solid var(--border-color);
          background: rgba(15, 22, 41, 0.6);
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          position: relative;
        }

        .chat-text-input {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 48px 10px 14px;
          color: var(--text-main);
          font-size: 0.9rem;
          outline: none;
          transition: var(--transition);
        }

        .chat-text-input:focus {
          border-color: var(--primary);
        }

        .chat-send-btn {
          position: absolute;
          right: 6px;
          background: var(--primary);
          border: none;
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .chat-send-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding: 0 4px;
        }

        .rate-limit-hint {
          font-size: 0.72rem;
          color: var(--text-dim);
        }

        .char-counter {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        .char-counter.warning {
          color: #F87171;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
