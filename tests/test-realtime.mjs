import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function createRestClient() {
  let token = null;
  const cookieJar = new Map();

  const csrfToken = () => cookieJar.get('csrfToken');

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()) && csrfToken()) {
      headers['X-CSRF-Token'] = csrfToken();
    }

    if (cookieJar.size > 0) {
      const cookieStr = Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      headers['Cookie'] = cookieStr;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);

    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (rawCookies.length === 0 && res.headers.get('set-cookie')) {
      rawCookies.push(res.headers.get('set-cookie'));
    }

    for (const cookie of rawCookies) {
      const parts = cookie.split(';')[0].split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (val === '') cookieJar.delete(key);
        else cookieJar.set(key, val);
      }
    }

    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (data?.data?.accessToken) {
      token = data.data.accessToken;
    }

    return {
      status: res.status,
      data,
      token,
      getCookieString: () =>
        Array.from(cookieJar.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
    };
  }

  return {
    get: (url, opts) => request(url, { ...opts, method: 'GET' }),
    post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
    put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
    delete: (url, opts) => request(url, { ...opts, method: 'DELETE' }),
    getToken: () => token,
    initializeCsrf: () => request('/auth/csrf'),
  };
}

// Helper to wait for a socket event with timeout
function waitForEvent(socket, eventName, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timeout waiting for event "${eventName}" after ${timeoutMs}ms`));
    }, timeoutMs);

    function handler(data) {
      clearTimeout(timer);
      socket.off(eventName, handler);
      resolve(data);
    }

    socket.on(eventName, handler);
  });
}

// Helper to assert that NO event is received (for tenant isolation)
function assertNoEvent(socket, eventName, waitMs = 400) {
  return new Promise((resolve, reject) => {
    let received = false;
    function handler(data) {
      received = true;
      reject(new Error(`ISOLATION LEAK: Received unauthorized event "${eventName}" with payload: ${JSON.stringify(data)}`));
    }

    socket.on(eventName, handler);
    setTimeout(() => {
      socket.off(eventName, handler);
      if (!received) resolve(true);
    }, waitMs);
  });
}

async function runRealtimeVerification() {
  console.log('========================================================');
  console.log('⚡ TRACK HERE — REAL-TIME MULTI-CLIENT SOCKET.IO AUDIT');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${message}`);
      failed++;
    }
  }

  // 1. Setup REST Clients & Users
  console.log('--- 1. Authenticating User A and User B ---');
  const restA = createRestClient();
  const restB = createRestClient();

  await restA.initializeCsrf();
  await restB.initializeCsrf();

  const randSuffix = Date.now().toString().slice(-6);
  const emailA = `scholar.a.${randSuffix}@trackhere.local`;
  const emailB = `scholar.b.${randSuffix}@trackhere.local`;

  const regA = await restA.post('/auth/register', {
    name: 'Narayana A (Primary)',
    email: emailA,
    password: 'Password123!',
  });
  assert(regA.status === 201, `User A registered (${emailA})`);

  const regB = await restB.post('/auth/register', {
    name: 'User B (Isolated)',
    email: emailB,
    password: 'Password123!',
  });
  assert(regB.status === 201, `User B registered (${emailB})`);

  const loginA = await restA.post('/auth/login', { email: emailA, password: 'Password123!' });
  const tokenA = loginA.data?.data?.accessToken || restA.getToken();
  const userAId = loginA.data?.data?.user?._id || loginA.data?.data?.user?.id;
  assert(Boolean(tokenA), `User A logged in (ID: ${userAId})`);

  const loginB = await restB.post('/auth/login', { email: emailB, password: 'Password123!' });
  const tokenB = loginB.data?.data?.accessToken || restB.getToken();
  const userBId = loginB.data?.data?.user?._id || loginB.data?.data?.user?.id;
  assert(Boolean(tokenB), `User B logged in (ID: ${userBId})`);

  // 2. Connect 3 Sockets:
  // - socketA1 (User A, Tab 1)
  // - socketA2 (User A, Tab 2 / Mobile Device)
  // - socketB1 (User B, Tab 1)
  console.log('\n--- 2. Connecting Multi-Session Sockets ---');

  const socketA1 = io(SOCKET_URL, {
    auth: { token: tokenA },
    transports: ['websocket'],
    reconnection: true,
  });

  const socketA2 = io(SOCKET_URL, {
    auth: { token: tokenA },
    transports: ['websocket'],
    reconnection: true,
  });

  const socketB1 = io(SOCKET_URL, {
    auth: { token: tokenB },
    transports: ['websocket'],
    reconnection: true,
  });

  await Promise.all([
    new Promise((res) => socketA1.on('connect', res)),
    new Promise((res) => socketA2.on('connect', res)),
    new Promise((res) => socketB1.on('connect', res)),
  ]);

  assert(socketA1.connected, `Socket A1 connected (ID: ${socketA1.id})`);
  assert(socketA2.connected, `Socket A2 connected (ID: ${socketA2.id}) [Concurrent Tab]`);
  assert(socketB1.connected, `Socket B1 connected (ID: ${socketB1.id}) [Tenant B]`);

  // 3. Real-Time Task Synchronization & Tenant Isolation
  console.log('\n--- 3. Testing Real-Time Task Sync across User A Tabs & Isolation from User B ---');

  // A creates a task
  const waitA1Task = waitForEvent(socketA1, 'task:created');
  const waitA2Task = waitForEvent(socketA2, 'task:created');
  const leakTaskCheck = assertNoEvent(socketB1, 'task:created');

  const taskRes = await restA.post('/tasks', {
    title: 'Implement Dijkstra in Go',
    category: 'Algorithms',
    priority: 'High',
    status: 'Todo',
  });
  const taskId = taskRes.data?.data?.task?._id;
  assert(taskRes.status === 201, `REST: User A created task (ID: ${taskId})`);

  const [a1TaskData, a2TaskData] = await Promise.all([waitA1Task, waitA2Task, leakTaskCheck]);
  assert((a1TaskData?._id || a1TaskData?.task?._id) === taskId, 'Socket A1 received "task:created" in real-time');
  assert((a2TaskData?._id || a2TaskData?.task?._id) === taskId, 'Socket A2 received "task:created" in real-time');
  assert(true, 'Socket B1 received ZERO events (Complete tenant isolation verified)');

  // A updates task status
  const waitA1Update = waitForEvent(socketA1, 'task:updated');
  const waitA2Update = waitForEvent(socketA2, 'task:updated');
  const leakUpdateCheck = assertNoEvent(socketB1, 'task:updated');

  const updateRes = await restA.put(`/tasks/${taskId}`, { status: 'Completed' });
  assert(updateRes.status === 200, 'REST: User A marked task Completed');

  const [a1UpData, a2UpData] = await Promise.all([waitA1Update, waitA2Update, leakUpdateCheck]);
  assert((a1UpData?.status || a1UpData?.task?.status) === 'Completed', 'Socket A1 received "task:updated" (status: Completed)');
  assert((a2UpData?.status || a2UpData?.task?.status) === 'Completed', 'Socket A2 received "task:updated" (status: Completed)');
  assert(true, 'Socket B1 received ZERO update events');

  // A deletes task
  const waitA1Delete = waitForEvent(socketA1, 'task:deleted');
  const waitA2Delete = waitForEvent(socketA2, 'task:deleted');
  const leakDeleteCheck = assertNoEvent(socketB1, 'task:deleted');

  const delRes = await restA.delete(`/tasks/${taskId}`);
  assert(delRes.status === 200, 'REST: User A deleted task');

  const [a1DelData, a2DelData] = await Promise.all([waitA1Delete, waitA2Delete, leakDeleteCheck]);
  assert((a1DelData?._id || a1DelData?.taskId) === taskId, 'Socket A1 received "task:deleted"');
  assert((a2DelData?._id || a2DelData?.taskId) === taskId, 'Socket A2 received "task:deleted"');

  // 4. Real-Time Notes Synchronization
  console.log('\n--- 4. Testing Real-Time Note Sync ---');

  const waitA1Note = waitForEvent(socketA1, 'note:created');
  const waitA2Note = waitForEvent(socketA2, 'note:created');
  const leakNoteCheck = assertNoEvent(socketB1, 'note:created');

  const noteRes = await restA.post('/notes', {
    title: 'OS Process Scheduling Cheatsheet',
    content: 'Round Robin: time quantum, Preemptive priority, Shortest Job Next',
    category: 'Operating Systems',
  });
  const noteId = noteRes.data?.data?.note?._id;
  assert(noteRes.status === 201, `REST: User A created note (ID: ${noteId})`);

  const [a1NoteData, a2NoteData] = await Promise.all([waitA1Note, waitA2Note, leakNoteCheck]);
  assert((a1NoteData?._id || a1NoteData?.note?._id) === noteId, 'Socket A1 received "note:created"');
  assert((a2NoteData?._id || a2NoteData?.note?._id) === noteId, 'Socket A2 received "note:created"');

  // Update Note
  const waitA1NoteUp = waitForEvent(socketA1, 'note:updated');
  const waitA2NoteUp = waitForEvent(socketA2, 'note:updated');
  await restA.put(`/notes/${noteId}`, { title: 'OS Scheduling Algorithms (Updated)' });
  const [a1NoteUp, a2NoteUp] = await Promise.all([waitA1NoteUp, waitA2NoteUp]);
  assert((a1NoteUp?.title || a1NoteUp?.note?.title) === 'OS Scheduling Algorithms (Updated)', 'Socket A1 received "note:updated"');
  assert((a2NoteUp?.title || a2NoteUp?.note?.title) === 'OS Scheduling Algorithms (Updated)', 'Socket A2 received "note:updated"');

  // Delete Note
  const waitA1NoteDel = waitForEvent(socketA1, 'note:deleted');
  const waitA2NoteDel = waitForEvent(socketA2, 'note:deleted');
  await restA.delete(`/notes/${noteId}`);
  const [a1NoteDel, a2NoteDel] = await Promise.all([waitA1NoteDel, waitA2NoteDel]);
  assert((a1NoteDel?._id || a1NoteDel?.noteId) === noteId, 'Socket A1 received "note:deleted"');
  assert((a2NoteDel?._id || a2NoteDel?.noteId) === noteId, 'Socket A2 received "note:deleted"');

  // 5. Real-Time Focus Timer Lifecycle Synchronization
  console.log('\n--- 5. Testing Real-Time Focus Timer Synchronization ---');

  // Start Timer
  const waitA1TimerStart = waitForEvent(socketA1, 'timer:started');
  const waitA2TimerStart = waitForEvent(socketA2, 'timer:started');
  const leakTimerCheck = assertNoEvent(socketB1, 'timer:started');

  const startTimerRes = await restA.post('/study-sessions/timer/start', {
    category: 'Algorithms',
    activityType: 'Coding',
    topic: 'Graph BFS & DFS',
  });
  assert(startTimerRes.status === 201 || startTimerRes.status === 200, 'REST: User A started 25m focus timer');

  const [a1Start, a2Start] = await Promise.all([waitA1TimerStart, waitA2TimerStart, leakTimerCheck]);
  assert((a1Start?.category || a1Start?.timer?.category) === 'Algorithms', 'Socket A1 received "timer:started"');
  assert((a2Start?.category || a2Start?.timer?.category) === 'Algorithms', 'Socket A2 received "timer:started"');

  // Pause Timer
  const waitA1TimerPause = waitForEvent(socketA1, 'timer:paused');
  const waitA2TimerPause = waitForEvent(socketA2, 'timer:paused');
  await restA.post('/study-sessions/timer/pause');
  const [a1Pause, a2Pause] = await Promise.all([waitA1TimerPause, waitA2TimerPause]);
  assert(Boolean(a1Pause?.timerState?.status === 'paused' || a1Pause?.isPaused), 'Socket A1 received "timer:paused"');
  assert(Boolean(a2Pause?.timerState?.status === 'paused' || a2Pause?.isPaused), 'Socket A2 received "timer:paused"');

  // Resume Timer
  const waitA1TimerResume = waitForEvent(socketA1, 'timer:resumed');
  const waitA2TimerResume = waitForEvent(socketA2, 'timer:resumed');
  await restA.post('/study-sessions/timer/resume');
  const [a1Resume, a2Resume] = await Promise.all([waitA1TimerResume, waitA2TimerResume]);
  assert(Boolean(a1Resume?.timerState?.status === 'running' || !a1Resume?.isPaused), 'Socket A1 received "timer:resumed"');
  assert(Boolean(a2Resume?.timerState?.status === 'running' || !a2Resume?.isPaused), 'Socket A2 received "timer:resumed"');

  // Finish Timer
  const waitA1TimerFinish = waitForEvent(socketA1, 'timer:finished');
  const waitA2TimerFinish = waitForEvent(socketA2, 'timer:finished');
  const waitA1SessionCreated = waitForEvent(socketA1, 'session:created');
  const waitA2SessionCreated = waitForEvent(socketA2, 'session:created');

  const finishTimerRes = await restA.post('/study-sessions/timer/finish', {
    notes: 'Completed tree traversals practice set',
    actualDuration: 25,
  });
  assert(finishTimerRes.status === 200, 'REST: User A finished and saved timer session');

  const [a1Finish, a2Finish, a1Sess, a2Sess] = await Promise.all([
    waitA1TimerFinish,
    waitA2TimerFinish,
    waitA1SessionCreated,
    waitA2SessionCreated,
  ]);
  assert(Boolean(a1Finish?._id || a1Finish?.session), 'Socket A1 received "timer:finished"');
  assert(Boolean(a2Finish?._id || a2Finish?.session), 'Socket A2 received "timer:finished"');
  assert(Boolean(a1Sess?._id || a1Sess?.session), 'Socket A1 received "session:created"');
  assert(Boolean(a2Sess?._id || a2Sess?.session), 'Socket A2 received "session:created"');

  // 6. Real-Time Problem Journal Synchronization
  console.log('\n--- 6. Testing Real-Time Problem Journal Synchronization ---');

  const waitA1Prob = waitForEvent(socketA1, 'problem:created');
  const waitA2Prob = waitForEvent(socketA2, 'problem:created');

  const probRes = await restA.post('/problems', {
    name: 'LeetCode 15 - 3Sum',
    platform: 'LeetCode',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    status: 'Attempted',
  });
  const probId = probRes.data?._id || probRes.data?.data?.problem?._id;
  assert(probRes.status === 201, `REST: User A logged problem (ID: ${probId})`);

  const [a1Prob, a2Prob] = await Promise.all([waitA1Prob, waitA2Prob]);
  assert((a1Prob?._id || a1Prob?.problem?._id) === probId, 'Socket A1 received "problem:created"');
  assert((a2Prob?._id || a2Prob?.problem?._id) === probId, 'Socket A2 received "problem:created"');

  // Update Problem
  const waitA1ProbUp = waitForEvent(socketA1, 'problem:updated');
  const waitA2ProbUp = waitForEvent(socketA2, 'problem:updated');
  await restA.put(`/problems/${probId}`, { status: 'Solved' });
  const [a1ProbUp, a2ProbUp] = await Promise.all([waitA1ProbUp, waitA2ProbUp]);
  assert((a1ProbUp?.status || a1ProbUp?.problem?.status) === 'Solved', 'Socket A1 received "problem:updated" (Solved)');
  assert((a2ProbUp?.status || a2ProbUp?.problem?.status) === 'Solved', 'Socket A2 received "problem:updated" (Solved)');

  // Delete Problem
  const waitA1ProbDel = waitForEvent(socketA1, 'problem:deleted');
  const waitA2ProbDel = waitForEvent(socketA2, 'problem:deleted');
  await restA.delete(`/problems/${probId}`);
  const [a1ProbDel, a2ProbDel] = await Promise.all([waitA1ProbDel, waitA2ProbDel]);
  assert((a1ProbDel?._id || a1ProbDel?.problemId) === probId, 'Socket A1 received "problem:deleted"');
  assert((a2ProbDel?._id || a2ProbDel?.problemId) === probId, 'Socket A2 received "problem:deleted"');

  // 7. Multi-Client Disconnection and Recovery Test
  console.log('\n--- 7. Testing Socket Reconnection & Event Recovery ---');

  // Disconnect Socket A2 explicitly
  socketA2.disconnect();
  assert(!socketA2.connected, 'Socket A2 disconnected intentionally');

  // Reconnect Socket A2
  socketA2.connect();
  await new Promise((res) => socketA2.on('connect', res));
  assert(socketA2.connected, `Socket A2 reconnected successfully (New ID: ${socketA2.id})`);

  // Send a task event after reconnection
  const waitReconnTask = waitForEvent(socketA2, 'task:created');
  const postReconnTask = await restA.post('/tasks', {
    title: 'Post-reconnection sync verification task',
    category: 'Algorithms',
    priority: 'Medium',
    status: 'Todo',
  });
  const reconnectedTaskData = await waitReconnTask;
  assert(
    (reconnectedTaskData?.title || reconnectedTaskData?.task?.title) === 'Post-reconnection sync verification task',
    'Reconnected Socket A2 received real-time event immediately without manual refresh'
  );

  // Clean up reconnected task
  if (postReconnTask.data?.data?.task?._id) {
    await restA.delete(`/tasks/${postReconnTask.data.data.task._id}`);
  }

  // Cleanup all sockets
  socketA1.disconnect();
  socketA2.disconnect();
  socketB1.disconnect();

  console.log('\n========================================================');
  console.log(`TOTAL REAL-TIME CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL REAL-TIME SYNCHRONIZATION AND TENANT ISOLATION CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED!');
    process.exit(1);
  }
}

runRealtimeVerification().catch((err) => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});
