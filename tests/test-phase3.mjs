import './_guard.mjs';

const BASE_URL = 'http://localhost:5000/api';

function createClient() {
  let token = null;
  const cookieJar = new Map();
  const csrfToken = () => cookieJar.get('csrfToken');

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
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
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (rawCookies.length === 0 && res.headers.get('set-cookie')) rawCookies.push(res.headers.get('set-cookie'));
    for (const cookie of rawCookies) {
      const parts = cookie.split(';')[0].split('=');
      if (parts.length >= 2) cookieJar.set(parts[0].trim(), parts.slice(1).join('=').trim());
    }
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    if (data?.data?.accessToken) token = data.data.accessToken;
    return { status: res.status, data };
  }

  return {
    get: (url, opts) => request(url, { ...opts, method: 'GET' }),
    post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
  };
}

async function verifyAuthPhase3() {
  console.log('========================================================');
  console.log('🔒 PHASE 3 — AUTHENTICATION, AGE GATE & ROUTE PROTECTION');
  console.log('========================================================\n');

  const client = createClient();
  await client.get('/auth/csrf');

  // 1. Under 13 is rejected on the server
  const under13Res = await client.post('/auth/register', {
    name: 'Young Kid',
    email: 'kid.' + Date.now() + '@trackhere.dev',
    password: 'Password123!',
    ageBand: 'under13'
  });
  console.log('1. Server blocks under13 registration (400):', under13Res.status === 400 ? '✅ PASS' : '❌ FAIL', `("${under13Res.data?.message}")`);

  // 2. 13_17 succeeds
  const teenEmail = 'teen.' + Date.now() + '@trackhere.dev';
  const teenRes = await client.post('/auth/register', {
    name: 'Teen Scholar',
    email: teenEmail,
    password: 'Password123!',
    ageBand: '13_17'
  });
  console.log('2. Server accepts 13_17 registration (201):', teenRes.status === 201 ? '✅ PASS' : '❌ FAIL', `(ageBand stored: ${teenRes.data?.data?.user?.ageBand})`);

  // 3. 18_plus succeeds
  const adultEmail = 'adult.' + Date.now() + '@trackhere.dev';
  const adultRes = await client.post('/auth/register', {
    name: 'Adult Scholar',
    email: adultEmail,
    password: 'Password123!',
    ageBand: '18_plus'
  });
  console.log('3. Server accepts 18_plus registration (201):', adultRes.status === 201 ? '✅ PASS' : '❌ FAIL', `(ageBand stored: ${adultRes.data?.data?.user?.ageBand})`);

  // 4. Bad login
  const badLogin = await client.post('/auth/login', {
    email: 'nonexistent.' + Date.now() + '@trackhere.dev',
    password: 'WrongPassword!'
  });
  console.log('4. Login rejection for nonexistent/wrong password (401):', badLogin.status === 401 ? '✅ PASS' : '❌ FAIL');

  // 5. Forgot password safe response
  const forgotRes = await client.post('/auth/forgot-password', {
    email: 'nonexistent.' + Date.now() + '@trackhere.dev'
  });
  console.log('5. Forgot password responds safely without leaking existence (200):', forgotRes.status === 200 ? '✅ PASS' : '❌ FAIL');
  console.log('\n========================================================');
}

verifyAuthPhase3().catch(console.error);

