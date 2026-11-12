// tests/test-socket-origin.mjs (run: TEST_TOKEN=<a valid access token> node tests/test-socket-origin.mjs)
import './_guard.mjs';
import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';

const URL = process.env.API_ORIGIN || 'http://localhost:5000';
const GOOD = process.env.GOOD_ORIGIN || 'http://localhost:5173';

let token = process.env.TEST_TOKEN;

// Auto-provision test token if not provided in environment
if (!token) {
  try {
    const email = `socket_test_${Date.now()}@test.dev`;
    // Fetch CSRF first
    const csrfRes = await fetch(`${URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json().catch(() => ({}));
    const setCookie = csrfRes.headers.get('set-cookie') || '';

    const regRes = await fetch(`${URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfData?.data?.csrfToken || '',
        'Cookie': setCookie,
      },
      body: JSON.stringify({
        name: 'Socket Tester',
        email,
        password: 'Passw0rd!Secure123',
        ageBand: '18_plus',
      }),
    });
    const regData = await regRes.json();
    token = regData?.data?.accessToken;
  } catch (err) {
    console.error('Failed to auto-fetch test token:', err.message);
  }
}

const attempt = (origin) =>
  new Promise((resolve) => {
    const s = io(URL, {
      transports: ['websocket'],
      extraHeaders: { Origin: origin },
      auth: { token },
      reconnection: false,
    });
    const done = (v) => {
      s.close();
      resolve(v);
    };
    s.on('connect', () => done('connected'));
    s.on('connect_error', () => done('rejected'));
    setTimeout(() => done('rejected'), 4000);
  });

const good = await attempt(GOOD);
const evil = await attempt('https://evil.example');

console.log(good === 'connected' ? 'PASS good origin connects' : 'FAIL good origin rejected');
console.log(evil === 'rejected' ? 'PASS evil origin rejected' : 'FAIL evil origin connected');

process.exit(good === 'connected' && evil === 'rejected' ? 0 : 1);
