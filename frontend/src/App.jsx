import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Streamer from './pages/Streamer';
import Visitor from './pages/Visitor';
import useStreamStatus from './hooks/useStreamStatus';

export default function App() {
  const { isLive, viewerCount, title } = useStreamStatus();

  return (
    <div className="app-layout">
      <Navbar isLive={isLive} viewerCount={viewerCount} />

      <main className="app-main-content">
        <Routes>
          <Route
            path="/"
            element={<Home isLive={isLive} viewerCount={viewerCount} streamTitle={title} />}
          />
          <Route path="/streamer" element={<Streamer />} />
          <Route path="/visitor" element={<Visitor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
