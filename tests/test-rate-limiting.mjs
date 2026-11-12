import './_guard.mjs';

/**
 * Verification for Step 9.3:
 * Fail-closed rate limiting & startup environment validation
 */

const BASE = 'http://localhost:5000/api';

async function checkHealth() {
  const res = await fetch(`${BASE}/health`);
  const data = await res.json();
  console.log('1. Health check status (200 expected):', res.status);
  console.log('2. Server running in mode:', data.env);
  console.log('3. Rate limiting headers present:',
    Boolean(res.headers.get('ratelimit-limit') || res.headers.get('x-ratelimit-limit') || res.headers.get('ratelimit-remaining')));
}

checkHealth().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});

