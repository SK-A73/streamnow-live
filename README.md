# StreamNow — Real-Time Live Streaming Web Application

[![LiveKit Cloud](https://img.shields.io/badge/LiveKit-Cloud_WebRTC-7657F6?style=flat&logo=webrtc)](https://cloud.livekit.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time_Chat-010101?style=flat&logo=socket.io)](https://socket.io/)
[![React + Vite](https://img.shields.io/badge/React_19-Vite_SPA-61DAFB?style=flat&logo=react)](https://vitejs.dev/)
[![Node.js Express](https://img.shields.io/badge/Node.js-Express_API-339933?style=flat&logo=node.js)](https://expressjs.com/)

StreamNow is a full-stack, production-ready real-time live streaming web application. It allows a broadcaster to stream their webcam and microphone with sub-second WebRTC latency using **LiveKit Cloud**, while allowing multiple concurrent visitors to watch the live broadcast and interact via a synchronized real-time chat powered by **Socket.IO**.

---

## Architecture Overview

```
                                  +-----------------------------+
                                  |        LiveKit Cloud        |
                                  |   (WebRTC SFU Media Mesh)   |
                                  +--------------+--------------+
                                                 ^
                         Video / Audio Tracks    |    Video / Audio Tracks
                         (Publish via WebRTC)    |    (Subscribe via WebRTC)
                                                 v
+------------------------+           +-----------+-------------+           +------------------------+
|   Streamer Dashboard   |           |     StreamNow Backend   |           |      Visitor Page      |
|  (React + LiveKit SDK) | <-------> |  (Node/Express + Socket)| <-------> |  (React + LiveKit SDK) |
+------------------------+  REST &   +-------------------------+  REST &   +------------------------+
                          Socket.IO                             Socket.IO
```

---

## Key Features

- **Real-Time Video Broadcasting**: Hardware webcam preview and ultra-low latency WebRTC streaming via LiveKit Cloud.
- **Hardware Controls**: Toggle camera and mute/unmute microphone dynamically during broadcast.
- **Audience Viewing Experience**: High-definition video player with audio auto-play handling, fullscreen mode, and dynamic offline/stream-ended screens.
- **Real-Time Synchronized Live Chat**:
  - Sub-millisecond comment broadcast across all connected viewers and the streamer.
  - Distinctive visual styling and badges for Streamer messages vs. Visitors.
  - Input validation, XSS escaping, 300-character counter, and client/server rate-limiting.
  - Auto-scroll with smart scroll-lock detection and "Latest comments" indicator.
- **Live Stream Telemetry**:
  - Accurate live viewer counting synchronized via Socket.IO room events.
  - Live broadcast timer (HH:MM:SS).
  - Dynamic stream title updating by the streamer while live.
- **Security & Authorization**:
  - LiveKit server-side AccessToken generation with granular grants (`canPublish: true` for streamer, `canPublish: false` for visitors).
  - Streamer access secret protection (`STREAMER_ACCESS_SECRET`) preventing unauthorized stream takeovers.
  - Backend API rate limiting to safeguard endpoints against spam.
- **Responsive Dark Theme UI/UX**:
  - Designed with dark aesthetics (`#0B1020`), glassmorphic panels, and purple/cyan gradient accents.
  - Adapts to Desktop, Tablet, and Mobile viewport layouts.

---

## Technology Stack

### Frontend
- **Framework**: React 19 (SPA)
- **Tooling**: Vite
- **Routing**: React Router DOM (v7)
- **Streaming Client**: `livekit-client`
- **Real-Time Messaging**: `socket.io-client`
- **Icons**: `lucide-react`
- **Styling**: Modern CSS3 variables, glassmorphism, responsive flex/grid

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Real-Time Engine**: Socket.IO
- **LiveKit Server SDK**: `livekit-server-sdk`
- **Middleware**: `cors`, `dotenv`, `express-rate-limit`

### Streaming Infrastructure
- **LiveKit Cloud**: Cloud-hosted WebRTC Selective Forwarding Unit (SFU) for scalable audio/video routing.

---

## Project Structure

```
live-streaming/
├── backend/
│   ├── middleware/
│   │   └── auth.js             # Streamer authorization & secret verification
│   ├── routes/
│   │   ├── livekitRoutes.js    # POST /api/livekit/token (Generates LiveKit JWT tokens)
│   │   └── streamRoutes.js     # REST API for stream status, start, stop, title, viewers
│   ├── services/
│   │   ├── livekitService.js   # LiveKit Server SDK integration & grant management
│   │   └── streamState.js      # In-memory stream metadata, viewer map, and chat buffer
│   ├── socket/
│   │   └── socketHandler.js    # Socket.IO connection, room management, rate-limited chat
│   ├── test-integration.js     # Automated end-to-end integration test suite
│   ├── server.js               # Express server, HTTP, and Socket.IO initialization
│   ├── .env.example            # Backend environment variables template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.jsx         # Real-time chat UI with tags, character count & scroll
│   │   │   ├── LiveBadge.jsx       # Animated pulsing LIVE / OFFLINE badge
│   │   │   ├── Navbar.jsx          # Top navigation with live status indicator
│   │   │   ├── StreamControls.jsx  # Start/Stop Live, Camera & Mic toggles
│   │   │   └── VideoPlayer.jsx     # Visitor WebRTC player, fullscreen, offline screens
│   │   ├── hooks/
│   │   │   └── useStreamStatus.js  # React hook for real-time stream status synchronization
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with Streamer & Visitor entry cards
│   │   │   ├── Streamer.jsx        # Broadcaster dashboard, webcam preview, studio controls
│   │   │   └── Visitor.jsx         # Visitor watching room and participant chat
│   │   ├── services/
│   │   │   ├── api.js              # REST API client
│   │   │   ├── livekit.js          # LiveKit client room & track lifecycle manager
│   │   │   └── socket.js           # Socket.IO client instance & event emitters
│   │   ├── styles/
│   │   │   └── index.css           # Global dark theme styles, animations, and typography
│   │   ├── App.jsx                 # App routes and shell
│   │   └── main.jsx                # React root mount
│   ├── index.html
│   ├── .env.example                # Frontend environment variables template
│   └── package.json
│
├── package.json                    # Workspace scripts for running both services
├── .gitignore
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Node v20+ recommended)
- **npm**: v9.0.0 or later
- A webcam and microphone (for broadcasting)
- Modern web browser (Chrome, Edge, Firefox, or Safari)

---

### 2. LiveKit Cloud Setup

To enable real-time video streaming between different devices or networks:

1. Go to [https://cloud.livekit.io/](https://cloud.livekit.io/) and create a free account.
2. Create a new project (e.g., `StreamNow`).
3. Under **Project Settings** > **Keys**:
   - Copy the **WebSocket URL** (e.g., `wss://your-project-id.livekit.cloud`).
   - Copy the **API Key** (e.g., `APIxxxxxxxxxxxx`).
   - Copy the **API Secret** (e.g., `secretxxxxxxxxxxxx`).

---

### 3. Environment Configuration

#### Backend Configuration
Navigate to the `backend/` directory and create `.env` from `.env.example`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual credentials:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# LiveKit Cloud Credentials
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here

# Demo Streamer Access Secret (protects publishing)
STREAMER_ACCESS_SECRET=streamer123
```

#### Frontend Configuration
Navigate to `frontend/` and configure `.env`:

```bash
cd ../frontend
cp .env.example .env
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

### 4. Installation

Install dependencies for both backend and frontend:

```bash
# From the root directory:
npm run install:all

# Or individually:
cd backend && npm install
cd ../frontend && npm install
```

---

### 5. Running the Application

You can start both servers simultaneously or in separate terminal windows:

#### Option A: Running from Root (Concurrent)
```bash
# Terminal 1 - Backend Server
npm run start:backend

# Terminal 2 - Frontend Vite Server
npm run start:frontend
```

#### Option B: Running Individually
```bash
# Terminal 1 (Backend on port 5000):
cd backend
npm run dev

# Terminal 2 (Frontend on port 5173):
cd frontend
npm run dev
```

Once running:
- Open your browser at **http://localhost:5173**

---

## End-to-End Testing Guide (Using Two Browser Sessions)

Follow this step-by-step walkthrough to test all features:

### Test Scenario 1: Navigation & Landing Page
1. Open `http://localhost:5173` in your browser.
2. Confirm the modern landing page loads with the heading: *"Go Live. Connect. Share."*
3. Verify the **Live Status** badge displays `OFFLINE`.
4. Confirm both cards are interactive:
   - **Go as Streamer** (`/streamer`)
   - **Go as Visitor** (`/visitor`)

### Test Scenario 2: Streamer Setup & Preview
1. Click **Start Streaming** or navigate to `http://localhost:5173/streamer`.
2. Allow browser camera and microphone permissions when prompted.
3. Verify your webcam video preview appears in the mirrored video box.
4. Test clicking **Camera On** / **Camera Off** and **Mic On** / **Muted** to confirm hardware toggling.
5. Click **Edit Title** and change the title (e.g., *"My Tech Talk & Live Coding"*).

### Test Scenario 3: Start Live Broadcast
1. In the Streamer Dashboard, click the purple **Start Live Broadcast** button.
2. Confirm:
   - The status badge transitions to the pulsing red `LIVE` badge.
   - The live duration timer starts incrementing (e.g. `00:01`, `00:02`...).
   - A success notification confirms the broadcast is live.

### Test Scenario 4: Join as Visitor
1. Open a new **Incognito window** (or a separate browser like Chrome/Edge).
2. Navigate to `http://localhost:5173/visitor`.
3. In the display name modal, enter a name (e.g., *"Alex"*), then click **Join Stream**.
4. Confirm:
   - The visitor connects to the stream and subscribes to the streamer's video and audio tracks.
   - The viewer count on both the streamer dashboard and visitor page increments to `1`.

### Test Scenario 5: Real-Time Live Chat
1. On the Visitor page, type a message into the chat box (e.g. *"Hello from the audience!"*) and press **Enter**.
2. Switch to the Streamer window: confirm the message appears **instantly** with the visitor's name and timestamp.
3. In the Streamer window, send a reply (e.g. *"Welcome Alex! Thanks for tuning in!"*).
4. Switch back to the Visitor window: confirm the streamer's comment appears with the highlighted **STREAMER** badge and avatar.
5. Open a **third tab/window** as a second visitor (e.g., *"Sam"*):
   - Confirm viewer count updates to `2`.
   - Confirm all participants receive new messages in real time without refreshing.

### Test Scenario 6: Rate Limiting & Input Validation
1. Try sending an empty message or spamming Enter repeatedly.
2. Confirm the chat box prevents empty comments and displays a rate-limiting cooldown notice.
3. Observe the character counter (`0 / 300`) turning orange/red when typing long messages.

### Test Scenario 7: Stop Live & Disconnection Handling
1. In the Streamer dashboard, click the red **Stop Broadcast** button.
2. In the Visitor window:
   - Observe the live video cleanly unpublish.
   - The "Live Stream Ended" screen appears with a button to return home.
3. Close the visitor browser window: observe the viewer count in the backend decrement automatically.

---

## Automated Integration Test Suite

The repository includes a comprehensive automated test script (`backend/test-integration.js`) that verifies:
- Initial stream status and schema.
- Security enforcement on unauthorized start/stop requests.
- LiveKit token generation and role grant restrictions.
- Multi-client Socket.IO real-time synchronization.
- Real-time comment broadcasting and streamer badge role validation.
- Viewer count increments and disconnect decrements.
- Complete stream lifecycle (Start -> Title Update -> Stop).

To run the test suite:

```bash
# Make sure the backend server is running, then in another terminal:
cd backend
npm test
```

Expected output:
```
🧪 Starting StreamNow End-to-End Integration Tests...
--- Test 1: Initial Stream Status ---
  ✅ PASS: Response success is true
  ✅ PASS: Initial isLive is false
  ✅ PASS: viewerCount is a number
...
========================================
📊 Test Summary: 26 Passed, 0 Failed
========================================
```

---

## Deployment Readiness

### 1. Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the **Root Directory** to `frontend`.
4. Add environment variables in the Vercel Dashboard:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://streamnow-backend.onrender.com`)
   - `VITE_SOCKET_URL`: Your deployed backend URL (e.g., `https://streamnow-backend.onrender.com`)
5. Click **Deploy**.

### 2. Backend (Render / Railway / VPS)
1. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
2. Set the **Root Directory** to `backend`.
3. Build command: `npm install`
4. Start command: `node server.js`
5. Configure Environment Variables:
   - `PORT`: `5000` (or leave default for host)
   - `FRONTEND_URL`: Your deployed frontend Vercel URL (e.g., `https://streamnow.vercel.app`)
   - `LIVEKIT_URL`: `wss://your-project.livekit.cloud`
   - `LIVEKIT_API_KEY`: `your_key`
   - `LIVEKIT_API_SECRET`: `your_secret`
   - `STREAMER_ACCESS_SECRET`: `your_strong_secret_password`

### 3. WebRTC Security Requirements (HTTPS)
> [!IMPORTANT]
> Modern web browsers restrict webcam and microphone access (`navigator.mediaDevices.getUserMedia`) to **HTTPS** origins (or `localhost` for development). When deploying to production, ensure both the frontend and backend utilize valid SSL/TLS certificates.

---

## API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/stream/status` | Current stream status, viewer count, title | No |
| `POST` | `/api/stream/start` | Starts the broadcast and notifies sockets | Yes (`STREAMER_ACCESS_SECRET`) |
| `POST` | `/api/stream/stop` | Stops the broadcast and notifies sockets | Yes (`STREAMER_ACCESS_SECRET`) |
| `PUT` | `/api/stream/title` | Updates the live broadcast title | Yes (`STREAMER_ACCESS_SECRET`) |
| `GET` | `/api/stream/viewers` | Returns viewer count and active visitor list | No |
| `POST` | `/api/livekit/token` | Generates LiveKit JWT with room permissions | Secret needed for streamer role |
| `GET` | `/api/health` | Health check & LiveKit configuration check | No |

---

## Known Limitations & Production Enhancements

1. **Single Stream Room**: The current architecture is optimized for a single broadcast room (`streamnow-main-room`). For multi-tenant twitch-like architectures, rooms can be keyed by channel username (e.g., `/api/stream/:channelName`).
2. **Persistent Database**: Stream state and chat history currently use an in-memory ring buffer (up to 100 recent messages). For permanent chat history, attach a database such as MongoDB, PostgreSQL, or Redis.
3. **Streamer Authentication**: The demo streamer secret provides quick verification. In enterprise production, replace this with OAuth2, JWT user sessions, or Clerk/Auth0 authentication.

---

## License

This project is licensed under the MIT License.
