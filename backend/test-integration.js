const io = require('socket.io-client');

const API_URL = 'http://localhost:5000';
const STREAMER_SECRET = 'streamer123';

async function runTests() {
  console.log('🧪 Starting StreamNow End-to-End Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- Test 1: GET /api/stream/status (Initial) ---
  console.log('--- Test 1: Initial Stream Status ---');
  const res1 = await fetch(`${API_URL}/api/stream/status`);
  const data1 = await res1.json();
  assert(data1.success === true, 'Response success is true');
  assert(data1.isLive === false, 'Initial isLive is false');
  assert(typeof data1.viewerCount === 'number', 'viewerCount is a number');

  // --- Test 2: Auth Protection on /api/stream/start ---
  console.log('\n--- Test 2: Streamer Auth Security ---');
  const resNoAuth = await fetch(`${API_URL}/api/stream/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Unauthorized Test' })
  });
  assert(resNoAuth.status === 401, 'POST /start without secret returns 401 Unauthorized');

  const resWrongAuth = await fetch(`${API_URL}/api/stream/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hack Test', streamerSecret: 'wrongsecret' })
  });
  assert(resWrongAuth.status === 403, 'POST /start with wrong secret returns 403 Forbidden');

  // --- Test 3: Token Generation Role Permissions ---
  console.log('\n--- Test 3: LiveKit Token Generation ---');
  // Visitor token
  const resVisitorToken = await fetch(`${API_URL}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'visitor_1', name: 'Visitor Alice', role: 'visitor' })
  });
  const dataVisitorToken = await resVisitorToken.json();
  assert(dataVisitorToken.success === true, 'Visitor token generated successfully');
  assert(dataVisitorToken.role === 'visitor', 'Visitor role confirmed');
  assert(typeof dataVisitorToken.token === 'string', 'Visitor JWT token returned');

  // Streamer token with valid secret
  const resStreamerToken = await fetch(`${API_URL}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: 'streamer_1',
      name: 'Streamer Bob',
      role: 'streamer',
      streamerSecret: STREAMER_SECRET
    })
  });
  const dataStreamerToken = await resStreamerToken.json();
  assert(dataStreamerToken.success === true, 'Streamer token generated successfully');
  assert(dataStreamerToken.role === 'streamer', 'Streamer role confirmed');

  // Streamer token with INVALID secret
  const resStreamerTokenBad = await fetch(`${API_URL}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: 'streamer_hacker',
      role: 'streamer',
      streamerSecret: 'badsecret'
    })
  });
  assert(resStreamerTokenBad.status === 403, 'Streamer token rejected 403 on invalid secret');

  // --- Test 4: Socket.IO Real-Time Chat & Viewer Tracking ---
  console.log('\n--- Test 4: Socket.IO Real-Time Multi-Client Sync ---');
  const streamerSocket = io(API_URL);
  const visitorSocket1 = io(API_URL);
  const visitorSocket2 = io(API_URL);

  await new Promise((resolve) => setTimeout(resolve, 500));

  let v1ReceivedMessage = null;
  let streamerReceivedMessage = null;
  let viewerCountUpdate = 0;

  visitorSocket1.on('chat:new', (msg) => {
    v1ReceivedMessage = msg;
  });

  streamerSocket.on('chat:new', (msg) => {
    streamerReceivedMessage = msg;
  });

  streamerSocket.on('viewer:count', ({ count }) => {
    viewerCountUpdate = count;
  });

  // Join sockets
  streamerSocket.emit('viewer:join', { name: 'MainStreamer', role: 'streamer' });
  visitorSocket1.emit('viewer:join', { name: 'Visitor Alice', role: 'visitor' });
  visitorSocket2.emit('viewer:join', { name: 'Visitor Charlie', role: 'visitor' });

  await new Promise((resolve) => setTimeout(resolve, 600));
  assert(viewerCountUpdate >= 2, `Viewer count incremented properly: count = ${viewerCountUpdate}`);

  // Visitor 2 sends a comment
  visitorSocket2.emit('chat:send', {
    message: 'Hello everyone! Great stream!',
    senderName: 'Visitor Charlie',
    role: 'visitor'
  });

  await new Promise((resolve) => setTimeout(resolve, 600));
  assert(
    v1ReceivedMessage && v1ReceivedMessage.message === 'Hello everyone! Great stream!',
    'Visitor 1 received comment sent by Visitor 2 in real time'
  );
  assert(
    streamerReceivedMessage && streamerReceivedMessage.message === 'Hello everyone! Great stream!',
    'Streamer received comment sent by Visitor 2 in real time'
  );
  assert(streamerReceivedMessage && streamerReceivedMessage.role === 'visitor', 'Comment has role visitor');

  // Streamer sends a comment
  let visitorReceivedStreamerMsg = null;
  visitorSocket1.on('chat:new', (msg) => {
    if (msg.role === 'streamer') {
      visitorReceivedStreamerMsg = msg;
    }
  });

  streamerSocket.emit('chat:send', {
    message: 'Welcome everyone to the stream!',
    senderName: 'MainStreamer',
    role: 'streamer',
    streamerSecret: STREAMER_SECRET
  });

  await new Promise((resolve) => setTimeout(resolve, 600));
  assert(
    visitorReceivedStreamerMsg && visitorReceivedStreamerMsg.role === 'streamer',
    'Streamer comment received by visitor with verified STREAMER role'
  );

  // Rate-limiting / Validation test: send empty message
  let chatErrorReceived = null;
  visitorSocket1.on('chat:error', (err) => {
    chatErrorReceived = err;
  });

  visitorSocket1.emit('chat:send', { message: '   ', senderName: 'Alice', role: 'visitor' });
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert(chatErrorReceived !== null, 'Empty comment properly rejected with chat:error');

  // Visitor 2 disconnects -> viewer count decrements
  visitorSocket2.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert(viewerCountUpdate === 1, `Viewer count decremented upon disconnect: count = ${viewerCountUpdate}`);

  // --- Test 5: Start & Stop Stream Cycle ---
  console.log('\n--- Test 5: Start and Stop Stream Lifecycle ---');
  let streamStartedReceived = false;
  visitorSocket1.on('stream:started', () => {
    streamStartedReceived = true;
  });

  const resStart = await fetch(`${API_URL}/api/stream/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Official Live Session',
      streamerSecret: STREAMER_SECRET,
      streamerName: 'MainStreamer'
    })
  });
  const dataStart = await resStart.json();
  assert(dataStart.success === true, 'Stream started via POST /api/stream/start');
  assert(dataStart.status.isLive === true, 'Stream status isLive is true');

  await new Promise((resolve) => setTimeout(resolve, 500));
  assert(streamStartedReceived === true, 'Socket.IO stream:started event broadcast to visitors');

  // Update title while live
  const resTitle = await fetch(`${API_URL}/api/stream/title`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Gaming & Coding Night',
      streamerSecret: STREAMER_SECRET
    })
  });
  const dataTitle = await resTitle.json();
  assert(dataTitle.success === true, 'Stream title updated via PUT /api/stream/title');
  assert(dataTitle.status.title === 'Gaming & Coding Night', 'Title matches updated title');

  // Stop stream
  let streamStoppedReceived = false;
  visitorSocket1.on('stream:stopped', () => {
    streamStoppedReceived = true;
  });

  const resStop = await fetch(`${API_URL}/api/stream/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ streamerSecret: STREAMER_SECRET })
  });
  const dataStop = await resStop.json();
  assert(dataStop.success === true, 'Stream stopped via POST /api/stream/stop');
  assert(dataStop.status.isLive === false, 'Stream status isLive is false');

  await new Promise((resolve) => setTimeout(resolve, 500));
  assert(streamStoppedReceived === true, 'Socket.IO stream:stopped event broadcast to visitors');

  // Cleanup sockets
  streamerSocket.disconnect();
  visitorSocket1.disconnect();

  console.log(`\n========================================`);
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
