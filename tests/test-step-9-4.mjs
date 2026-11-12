import './_guard.mjs';

const BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.cookies = new Map();
    this.csrfToken = '';
  }

  get cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  saveCookies(res, data) {
    if (res.headers.getSetCookie) {
      const setCookies = res.headers.getSetCookie();
      for (const str of setCookies) {
        const [cookiePart] = str.split(';');
        const [k, ...v] = cookiePart.split('=');
        if (k && v.length) {
          const key = k.trim();
          const val = v.join('=').trim();
          this.cookies.set(key, val);
          if (key === 'csrfToken') {
            this.csrfToken = val;
          }
        }
      }
    }
    if (data?.data?.csrfToken) {
      this.csrfToken = data.data.csrfToken;
    }
  }

  async getCsrf() {
    const headers = {};
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(`${BASE_URL}/auth/csrf`, { headers });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return this.csrfToken;
  }

  async post(path, body = {}, auth = true) {
    if (auth && !this.csrfToken) await this.getCsrf();
    const headers = { 'Content-Type': 'application/json' };
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;
    if (this.csrfToken) headers['X-CSRF-Token'] = this.csrfToken;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }

  async get(path) {
    const headers = {};
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }

  async delete(path, body = {}) {
    if (!this.csrfToken) await this.getCsrf();
    const headers = { 'Content-Type': 'application/json' };
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;
    if (this.csrfToken) headers['X-CSRF-Token'] = this.csrfToken;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }
}

async function runStep94Tests() {
  console.log('--- RUNNING STEP 9.4 VERIFICATION SUITE ---\n');
  let passed = 0;
  let total = 0;

  const assert = (condition, desc, extra = '') => {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${desc} ${extra}`);
    } else {
      console.error(`[FAIL] ${desc} ${extra}`);
    }
  };

  // 1. Register test user A
  const clientA = new ApiClient();
  const emailA = `step94_a_${Date.now()}@example.com`;
  const regA = await clientA.post('/auth/register', {
    name: 'User 94 A',
    email: emailA,
    password: 'Password123!',
    ageBand: '18_plus',
  });
  assert(regA.status === 201, 'User A registered successfully');

  // 2. Canonical routes exist: GET /api/users/me/export
  const expA = await clientA.get('/users/me/export');
  assert(expA.status === 200 && expA.data?.data?.user, 'GET /api/users/me/export returns 200 with user export data');

  // 3. Canonical routes exist: POST /api/users/me/restore
  const restA = await clientA.post('/users/me/restore', {
    tasks: [{ title: 'Restored Task 94', priority: 'High' }],
  });
  assert(restA.status === 200 && restA.data?.data?.counts?.tasks === 1, 'POST /api/users/me/restore accepts backup');

  // 4. Old routes return 404 (Removed aliases)
  const oldExp = await clientA.get('/users/export');
  assert(oldExp.status === 404, 'Legacy GET /api/users/export returns 404 Not Found');

  const oldImp = await clientA.post('/users/import', {});
  assert(oldImp.status === 404, 'Legacy POST /api/users/import returns 404 Not Found');

  const oldRest = await clientA.post('/users/restore', {});
  assert(oldRest.status === 404, 'Legacy POST /api/users/restore returns 404 Not Found');

  const oldAcc = await clientA.delete('/users/account', { password: 'Password123!' });
  assert(oldAcc.status === 404, 'Legacy DELETE /api/users/account returns 404 Not Found');

  // 5. Feedback endpoint verification
  // 5a. Unauthenticated feedback rejected
  const anonClient = new ApiClient();
  const unauthFb = await anonClient.post('/feedback', {
    kind: 'bug',
    message: 'Testing unauthenticated submission',
  }, false);
  assert(unauthFb.status === 401, 'POST /api/feedback without auth rejected with 401');

  // 5b. Authenticated feedback with strict schema
  const fbOk = await clientA.post('/feedback', {
    kind: 'bug',
    message: 'Modal does not dismiss on Escape',
    route: '/tasks',
  });
  assert(fbOk.status === 201 && fbOk.data?.data?.id, 'POST /api/feedback with valid schema returns 201');

  // 5c. Invalid schema: short message (< 3 chars) rejected
  const fbShort = await clientA.post('/feedback', {
    kind: 'idea',
    message: 'hi',
  });
  assert(fbShort.status === 400, 'POST /api/feedback with short message (<3 chars) rejected with 400', `(received: ${fbShort.status}, ${JSON.stringify(fbShort.data)})`);

  // 5d. Invalid schema: bad kind rejected
  const fbBadKind = await clientA.post('/feedback', {
    kind: 'invalid_category',
    message: 'Valid length message here',
  });
  assert(fbBadKind.status === 400, 'POST /api/feedback with invalid kind rejected with 400', `(received: ${fbBadKind.status}, ${JSON.stringify(fbBadKind.data)})`);

  // 6. User privacy in feedback: User B cannot see User A's feedback
  const clientB = new ApiClient();
  const emailB = `step94_b_${Date.now()}@example.com`;
  const regB = await clientB.post('/auth/register', {
    name: 'User 94 B',
    email: emailB,
    password: 'Password123!',
    ageBand: '18_plus',
  });
  assert(regB.status === 201, 'User B registered successfully');

  const fbListB = await clientB.get('/feedback');
  assert(fbListB.status === 200 && Array.isArray(fbListB.data?.data), 'GET /api/feedback for User B returns 200 array');
  const userAIdInBList = fbListB.data?.data?.some((item) => item.user === regA.data?.data?.user?.id || item.userEmail === emailA);
  assert(userAIdInBList === false && fbListB.data?.data?.length === 0, 'User B CANNOT see User A feedback (strict user isolation)');

  // 7. Profile guard: "Under 13" deletion without password
  const clientUnder13 = new ApiClient();
  const emailU13 = `under13_${Date.now()}@example.com`;
  const regU13 = await clientUnder13.post('/auth/register', {
    name: 'Under 13 User',
    email: emailU13,
    password: 'Password123!',
  });
  assert(regU13.status === 201, 'Under-13 account created for profile completion testing');

  const delU13 = await clientUnder13.delete('/users/me', { reason: 'under13' });
  assert(delU13.status === 200, 'DELETE /api/users/me with reason: "under13" succeeds without password for COPPA compliance');

  // Verify under-13 user is actually deleted
  const checkDel = await clientUnder13.get('/users/profile');
  assert(checkDel.status === 401, 'Deleted under-13 user session is invalidated and account purged');

  console.log(`\n========================================`);
  console.log(`Step 9.4 Verification: ${passed}/${total} tests PASSED.`);
  console.log(`========================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runStep94Tests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
