import './_guard.mjs';

/**
 * Track Here: Complete Smoke Test Suite (API + Business Logic)
 * Tests signup, age-band restriction, task creation, timer session log,
 * feedback submission, export, and account deletion.
 */

const BASE = 'http://localhost:5000/api';

function createClient() {
  let token = null;
  const cookieJar = new Map();
  const csrfToken = () => cookieJar.get('csrfToken');

  async function request(endpoint, options = {}) {
    const url = `${BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()) && csrfToken()) {
      headers['X-CSRF-Token'] = csrfToken();
    }
    if (cookieJar.size > 0) {
      headers['Cookie'] = Array.from(cookieJar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (rawCookies.length === 0 && res.headers.get('set-cookie')) rawCookies.push(res.headers.get('set-cookie'));
    for (const cookie of rawCookies) {
      const parts = cookie.split(';')[0].split('=');
      if (parts.length >= 2) cookieJar.set(parts[0].trim(), parts.slice(1).join('=').trim());
    }
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (data?.data?.accessToken) token = data.data.accessToken;
    return { status: res.status, data };
  }

  return {
    get: (url, opts) => request(url, { ...opts, method: 'GET' }),
    post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
    del: (url, body, opts) => request(url, { ...opts, method: 'DELETE', body }),
    getToken: () => token,
  };
}

async function runSmokeTest() {
  console.log('⚡ Starting Track Here Smoke Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, name, errDetails = '') {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name} ${errDetails}`);
      process.exitCode = 1;
    }
  }

  const client = createClient();

  // 1. Health check & CSRF fetch
  const health = await client.get('/health');
  assert(health.status === 200 && health.data.status === 'healthy', 'API /health returns 200 healthy');

  await client.get('/auth/csrf');

  // 2. Under 13 is strictly rejected
  const under13Res = await client.post('/auth/register', {
    name: 'Under Age',
    email: `under_${Date.now()}@test.dev`,
    password: 'Passw0rd!Secure123',
    ageBand: 'under13',
  });
  assert(under13Res.status === 400 || under13Res.status === 403, 'Under 13 registration is strictly blocked');

  // 3. Sign up with valid 18_plus
  const testEmail = `smoke_${Date.now()}@test.dev`;
  const password = 'Passw0rd!Secure123';
  const signupRes = await client.post('/auth/register', {
    name: 'Smoke Tester',
    email: testEmail,
    password,
    ageBand: '18_plus',
  });
  assert(signupRes.status === 201 && client.getToken(), 'Signup creates user and returns JWT accessToken', JSON.stringify(signupRes.data));

  // 4. Create a task
  const taskRes = await client.post('/tasks', {
    title: 'Complete Phase 8 Deploy Config',
    priority: 'High',
    dueOn: '2026-11-12',
  });
  const taskObj = taskRes.data?.data?.task || taskRes.data?.data;
  assert(taskRes.status === 201 && taskObj?.title === 'Complete Phase 8 Deploy Config', 'Create task endpoint works');

  // 5. Log a focus study session (25 mins)
  const sessionRes = await client.post('/study-sessions', {
    category: 'Computer Networks',
    activityType: 'Problem Solving',
    topic: 'TCP Congestion Control',
    focusDuration: 1500,
    startTime: new Date(Date.now() - 1500 * 1000).toISOString(),
    endTime: new Date().toISOString(),
  });
  assert(sessionRes.status === 201, 'Log study session (25 mins) works');

  // 6. Submit feedback (Prompt 8 item 1)
  const feedbackRes = await client.post('/feedback', {
    type: 'Idea',
    message: 'Love the new neutral light theme and timetable grid!',
    route: '/dashboard',
    appVersion: '1.0.0',
  });
  assert(feedbackRes.status === 201, 'Submit feedback endpoint works');

  // 7. Export full data (Prompt 6 item 3)
  const exportRes = await client.get('/users/me/export');
  assert(exportRes.status === 200 && Array.isArray(exportRes.data.data?.tasks), 'Full data export includes tasks & sessions');

  // 8. Delete account with typed confirmation & password (Prompt 6 item 2)
  const deleteRes = await client.del('/users/me', { password });
  assert(deleteRes.status === 200, 'Delete account permanently purges data with password confirmation');

  // 9. Verify token is now invalid
  const verifyDeleted = await client.get('/tasks');
  assert(verifyDeleted.status === 401 || verifyDeleted.status === 404, 'Deleted user cannot access private endpoints');

  console.log(`\n========================================`);
  console.log(`Summary: ${passed}/${total} smoke tests passed.`);
  console.log(`========================================\n`);
}

runSmokeTest().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
