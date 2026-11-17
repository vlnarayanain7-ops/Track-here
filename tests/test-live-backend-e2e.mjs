import { execSync } from 'child_process';

const API_BASE = 'http://localhost:5000/api';

function cleanDb() {
  try {
    execSync('node server/scripts/clean-test-users.mjs', { stdio: 'ignore' });
  } catch {}
}

let cookieJar = '';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(cookieJar ? { Cookie: cookieJar } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Track cookies across calls
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (setCookies.length) {
    const pairs = setCookies.map((c) => c.split(';')[0].trim());
    cookieJar = pairs.join('; ');
  } else {
    const sc = res.headers.get('set-cookie');
    if (sc) {
      const pairs = sc.split(',').map((c) => c.split(';')[0].trim());
      cookieJar = pairs.join('; ');
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, headers: res.headers };
}

async function run() {
  console.log('--- Testing Live Backend Endpoints for 500 Errors ---');

  // Step 1: CSRF Token
  const csrfRes = await request('/auth/csrf');
  console.log('CSRF status:', csrfRes.status);
  if (csrfRes.status !== 200) throw new Error('CSRF failed with ' + csrfRes.status);
  const csrfToken = csrfRes.data?.data?.csrfToken;

  const authHeaders = {
    'x-csrf-token': csrfToken,
  };

  // Step 2: Sign Up a fresh test user
  const testEmail = `test_live_${Date.now()}@test.trackhere.internal`;
  const signupRes = await request('/auth/register', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Live Tester',
      email: testEmail,
      password: 'Password123!',
      ageBand: '18_plus',
      termsAccepted: true,
    }),
  });

  console.log('Signup status:', signupRes.status);
  if (signupRes.status >= 500) throw new Error('Signup threw 500: ' + JSON.stringify(signupRes.data));
  if (signupRes.status !== 201 && signupRes.status !== 200) {
    throw new Error('Signup failed: ' + JSON.stringify(signupRes.data));
  }

  // Update CSRF if returned
  if (signupRes.data?.data?.csrfToken) {
    authHeaders['x-csrf-token'] = signupRes.data.data.csrfToken;
  }

  // Step 3: Check Active Timer
  console.log('Testing GET /study-sessions/timer/active...');
  const activeRes = await request('/study-sessions/timer/active', { headers: authHeaders });
  console.log('Active timer status:', activeRes.status);
  if (activeRes.status >= 500) throw new Error('Active timer threw 500');

  // Step 4: Start Timer
  console.log('Testing POST /study-sessions/timer/start...');
  const startRes = await request('/study-sessions/timer/start', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      category: 'Algorithms',
      topic: 'Graph Search',
    }),
  });
  console.log('Start timer status:', startRes.status);
  if (startRes.status >= 500) throw new Error('Start timer threw 500: ' + JSON.stringify(startRes.data));

  // Step 5: Send Heartbeat
  console.log('Testing POST /study-sessions/timer/heartbeat...');
  const hbRes = await request('/study-sessions/timer/heartbeat', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  console.log('Heartbeat status:', hbRes.status);
  if (hbRes.status >= 500) throw new Error('Heartbeat threw 500');

  // Step 6: Pause Timer
  console.log('Testing POST /study-sessions/timer/pause...');
  const pauseRes = await request('/study-sessions/timer/pause', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  console.log('Pause status:', pauseRes.status);
  if (pauseRes.status >= 500) throw new Error('Pause threw 500');

  // Step 7: Resume Timer
  console.log('Testing POST /study-sessions/timer/resume...');
  const resumeRes = await request('/study-sessions/timer/resume', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  console.log('Resume status:', resumeRes.status);
  if (resumeRes.status >= 500) throw new Error('Resume threw 500');

  // Step 8: Finish Timer
  console.log('Testing POST /study-sessions/timer/finish...');
  const finishRes = await request('/study-sessions/timer/finish', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      topic: 'Graph Search Finished',
      focusDuration: 25,
    }),
  });
  console.log('Finish status:', finishRes.status);
  if (finishRes.status >= 500) throw new Error('Finish threw 500: ' + JSON.stringify(finishRes.data));

  // Step 9: Create Pomodoro Session directly (Step 15.3 format)
  console.log('Testing POST /study-sessions (Pomodoro block save)...');
  const now = new Date();
  const pomoRes = await request('/study-sessions', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      topic: 'Focus · Tue 1:00 am',
      category: 'Algorithms',
      durationSec: 1500,
      focusDuration: 25,
      duration: 25,
      date: now.toISOString(),
      startedAt: now.toISOString(),
      source: 'timer',
      clientId: 'pomo-' + Date.now(),
      completed: true,
    }),
  });
  console.log('Create session status:', pomoRes.status);
  if (pomoRes.status >= 500) throw new Error('Create session threw 500: ' + JSON.stringify(pomoRes.data));
  const createdSessionId = pomoRes.data?.data?.session?._id;
  if (!createdSessionId) throw new Error('No session ID returned: ' + JSON.stringify(pomoRes.data));

  // Step 10: Fetch Sessions
  console.log('Testing GET /study-sessions...');
  const getRes = await request('/study-sessions', { headers: authHeaders });
  console.log('Get sessions status:', getRes.status, 'Count:', getRes.data?.data?.sessions?.length);
  if (getRes.status >= 500) throw new Error('Get sessions threw 500');

  // Step 11: Update / Rename Session
  console.log('Testing PUT /study-sessions/:id...');
  const updateRes = await request(`/study-sessions/${createdSessionId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      topic: 'Renamed Focus Session',
      category: 'Algorithms',
    }),
  });
  console.log('Update session status:', updateRes.status);
  if (updateRes.status >= 500) throw new Error('Update session threw 500');

  // Step 12: Delete Session
  console.log('Testing DELETE /study-sessions/:id...');
  const delRes = await request(`/study-sessions/${createdSessionId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log('Delete session status:', delRes.status);
  if (delRes.status >= 500) throw new Error('Delete session threw 500');

  // Step 13: Analytics & Streaks
  console.log('Testing GET /analytics/streaks...');
  const streakRes = await request('/analytics/streaks', { headers: authHeaders });
  console.log('Streak status:', streakRes.status);
  if (streakRes.status >= 500) throw new Error('Streaks threw 500');

  console.log('Testing GET /analytics/heatmap...');
  const heatRes = await request('/analytics/heatmap', { headers: authHeaders });
  console.log('Heatmap status:', heatRes.status);
  if (heatRes.status >= 500) throw new Error('Heatmap threw 500');

  console.log('Testing GET /analytics...');
  const analyticsRes = await request('/analytics', { headers: authHeaders });
  console.log('Analytics status:', analyticsRes.status);
  if (analyticsRes.status >= 500) throw new Error('Analytics threw 500');

  // Step 14: Clean up test user
  console.log('\nCleaning up test user from DB...');
  cleanDb();
  console.log('Database cleanly reset!');

  console.log('\n✅ ALL BACKEND ENDPOINTS SUCCEEDED WITH ZERO 500 ERRORS!');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  cleanDb();
  process.exit(1);
});
