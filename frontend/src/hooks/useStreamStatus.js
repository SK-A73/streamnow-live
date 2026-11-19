import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';
import api from '../services/api';

export function useStreamStatus() {
  const [streamInfo, setStreamInfo] = useState({
    isLive: false,
    title: 'Welcome to StreamNow Live Stream!',
    streamerName: 'Streamer',
    viewerCount: 0,
    startedAt: null,
    durationSeconds: 0,
    roomName: 'streamnow-main-room'
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStreamStatus();
      setStreamInfo(prev => ({
        ...prev,
        isLive: data.isLive,
        title: data.title || prev.title,
        streamerName: data.streamerName || prev.streamerName,
        viewerCount: data.viewerCount ?? prev.viewerCount,
        startedAt: data.startedAt,
        durationSeconds: data.durationSeconds || 0,
        roomName: data.roomName || prev.roomName
      }));
    } catch (err) {
      console.warn('Failed to fetch stream status from API:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Socket.IO real-time event listeners
    const socket = socketService.getSocket();

    const handleStreamStatus = (data) => {
      setStreamInfo(prev => ({
        ...prev,
        ...data
      }));
    };

    const handleStreamStarted = (data) => {
      console.log('📡 Stream started notification received');
      setStreamInfo(prev => ({
        ...prev,
        ...data,
        isLive: true
      }));
    };

    const handleStreamStopped = (data) => {
      console.log('🔌 Stream stopped notification received');
      setStreamInfo(prev => ({
        ...prev,
        ...data,
        isLive: false,
        startedAt: null,
        durationSeconds: 0
      }));
    };

    const handleViewerCount = ({ count }) => {
      setStreamInfo(prev => ({
        ...prev,
        viewerCount: count
      }));
    };

    socket.on('stream:status', handleStreamStatus);
    socket.on('stream:started', handleStreamStarted);
    socket.on('stream:stopped', handleStreamStopped);
    socket.on('viewer:count', handleViewerCount);

    return () => {
      socket.off('stream:status', handleStreamStatus);
      socket.off('stream:started', handleStreamStarted);
      socket.off('stream:stopped', handleStreamStopped);
      socket.off('viewer:count', handleViewerCount);
    };
  }, [fetchStatus]);

  return {
    ...streamInfo,
    loading,
    refreshStatus: fetchStatus
  };
}

export default useStreamStatus;
