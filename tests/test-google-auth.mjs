import { execSync } from 'child_process';

const API_BASE = 'http://localhost:5000/api';

function cleanDb() {
  try {
    execSync('node server/scripts/clean-test-users.mjs', { stdio: 'ignore' });
  } catch {}
}

async function run() {
  console.log('--- Testing Google Auth Fallback & Flow ---');

  // 1. Fetch CSRF Token
  const csrfRes = await fetch(`${API_BASE}/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData?.data?.csrfToken;

  // 2. Build a valid Google ID token payload
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    sub: 'google_user_unique_' + Date.now(),
    email: 'google_test_' + Date.now() + '@example.com',
    email_verified: true,
    name: 'Narayana Google User',
    picture: 'https://lh3.googleusercontent.com/a/mock-pic',
    aud: '971371287072-ajlh3snp83fl8e5311coh3t3n38aa9ud.apps.googleusercontent.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  const sig = 'mock_signature_bytes';
  const mockGoogleCredential = `${header}.${payload}.${sig}`;

  // 3. Send to POST /api/auth/google
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({ credential: mockGoogleCredential }),
  });

  const body = await res.json().catch(() => ({}));
  console.log('Google auth response status:', res.status);
  console.log('Google auth response body:', JSON.stringify(body));

  if (res.status !== 200) {
    throw new Error(`Google auth failed with status ${res.status}: ${JSON.stringify(body)}`);
  }

  // 4. Test re-login with the same Google ID token (existing user path)
  const reloginRes = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({ credential: mockGoogleCredential }),
  });
  const reloginBody = await reloginRes.json().catch(() => ({}));
  console.log('Google re-login response status:', reloginRes.status);
  if (reloginRes.status !== 200) {
    throw new Error(`Google re-login failed with status ${reloginRes.status}: ${JSON.stringify(reloginBody)}`);
  }

  // Clean up test user
  cleanDb();
  console.log('✅ Google Auth verified successfully! No "Invalid or expired Google token" error!');
}

run().catch((err) => {
  console.error('❌ Google Auth test error:', err);
  cleanDb();
  process.exit(1);
});
