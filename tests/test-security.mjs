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
    // console.log('REQ:', endpoint, 'Headers:', headers);
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (rawCookies.length === 0 && res.headers.get('set-cookie')) {
      rawCookies.push(res.headers.get('set-cookie'));
    }
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
    put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
    delete: (url, body, opts) => request(url, { ...opts, method: 'DELETE', body }),
  };
}

async function testHackerHardening() {
  console.log('========================================================');
  console.log('🛡️ TRACK HERE — SECURITY AUDIT & PENETRATION VERIFICATION');
  console.log('========================================================\n');

  const client = createClient();
  const email = 'hacker.verify.' + Date.now() + '@trackhere.local';
  const pass = 'SecretP@ssw0rd1!';

  // Get initial CSRF
  await client.get('/auth/csrf');

  // 1. Register & Login
  const reg = await client.post('/auth/register', { name: 'Hacker Verify', email, password: pass });
  console.log('1. User Register:', reg.status === 201 ? '✅ PASS' : '❌ FAIL');
  const login = await client.post('/auth/login', { email, password: pass });
  console.log('1b. User Login:', login.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 2. Change password with wrong current
  const wrongPass = await client.put('/users/password', { currentPassword: 'WrongPassword!', newPassword: 'NewSecretP@ss1!' });
  console.log('2. Change password rejects wrong current (400):', wrongPass.status === 400 ? '✅ PASS' : '❌ FAIL', `(msg: "${wrongPass.data?.message}")`);

  // 3. Change password with correct current
  const correctPass = await client.put('/users/password', { currentPassword: pass, newPassword: 'NewSecretP@ss1!' });
  console.log('3. Change password succeeds with correct current (200):', correctPass.status === 200 ? '✅ PASS' : '❌ FAIL', `(msg: "${correctPass.data?.message}")`);

  // 4. Login with old password fails (401)
  const oldLogin = await client.post('/auth/login', { email, password: pass });
  console.log('4. Login with old password rejected (401):', oldLogin.status === 401 ? '✅ PASS' : '❌ FAIL');

  // 5. Login with new password succeeds (200)
  const newLogin = await client.post('/auth/login', { email, password: 'NewSecretP@ss1!' });
  console.log('5. Login with new password succeeds (200):', newLogin.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 6. Delete account without password fails (400)
  const delNoPass = await client.delete('/users/me', {});
  console.log('6. Delete account requires password (400):', delNoPass.status === 400 ? '✅ PASS' : '❌ FAIL', `(msg: "${delNoPass.data?.message}")`);

  // 7. Delete account with wrong password fails (400)
  const delWrongPass = await client.delete('/users/me', { password: 'WrongPassword!' });
  console.log('7. Delete account rejects wrong password (400):', delWrongPass.status === 400 ? '✅ PASS' : '❌ FAIL', `(msg: "${delWrongPass.data?.message}")`);

  // 8. Query parameter type confusion DoS prevention (array instead of string)
  const typeConfusion = await client.get('/tasks?search[]=malicious&category[]=array&limit=999999');
  console.log('8. Query parameter type confusion handled safely without crash (200):', typeConfusion.status === 200 ? '✅ PASS' : '❌ FAIL');
  console.log('9. Pagination limit clamped from 999999 to 100:', typeConfusion.data?.data?.pagination?.limit === 100 ? '✅ PASS' : '❌ FAIL', `(Clamped Limit: ${typeConfusion.data?.data?.pagination?.limit})`);

  // 10. Forgot password does NOT leak reset token
  const forgot = await client.post('/auth/forgot-password', { email });
  console.log('10. Forgot password does not leak resetToken in production/dev:', forgot.data?.data?.resetToken === undefined ? '✅ PASS' : '❌ FAIL');

  // 11. Delete account with correct password succeeds (200)
  const delSuccess = await client.delete('/users/me', { password: 'NewSecretP@ss1!' });
  console.log('11. Delete account succeeds with correct password (200):', delSuccess.status === 200 ? '✅ PASS' : '❌ FAIL', `(msg: "${delSuccess.data?.message}")`);
  console.log('\n========================================================');
}

testHackerHardening().catch(console.error);
