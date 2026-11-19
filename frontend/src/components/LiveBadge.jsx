import React from 'react';

export default function LiveBadge({ isLive, className = '' }) {
  if (isLive) {
    return (
      <span className={`badge-live ${className}`}>
        <span className="dot" />
        LIVE
      </span>
    );
  }

  return (
    <span className={`badge-offline ${className}`}>
      <span className="dot" />
      OFFLINE
    </span>
  );
}
