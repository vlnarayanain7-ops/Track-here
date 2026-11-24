import test from 'node:test';
import assert from 'node:assert/strict';
import { OAuth2Client } from 'google-auth-library';

process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'https://study.example.test';
process.env.CLIENT_URLS = 'https://preview.example.test';
process.env.MONGODB_URI = 'mongodb://localhost/unit';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
process.env.GOOGLE_CLIENT_ID = 'local-test-client';
const { googleAuth } = await import('../controllers/authController.js');
const { isOriginAllowed } = await import('../config/cors.js');
const { requireAdmin } = await import('../controllers/rewardsController.js');

test('Google verification service failures stop sign-in before user lookup', async t => {
  const verifier = t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => { throw new Error('Verifier unavailable'); });
  const error = await new Promise(resolve => googleAuth({ body: { credential: 'unit-test' } }, {}, resolve));
  assert.equal(error.statusCode, 401);
  assert.deepEqual(verifier.mock.calls[0].arguments, [{ idToken: 'unit-test', audience: 'local-test-client' }]);
});

test('credentialed origins match exact configured frontend origins', () => {
  assert.equal(isOriginAllowed(process.env.CLIENT_URL), true);
  assert.equal(isOriginAllowed(process.env.CLIENT_URLS), true);
  assert.equal(isOriginAllowed('https://other.workers.dev'), false);
  assert.equal(isOriginAllowed('null'), false);
});

test('admin guard uses the approved account ID', async () => {
  process.env.ADMIN_USER_IDS = '000000000000000000000001';
  const response = { status(code) { this.statusCode = code; return this; }, json() {} };
  let admitted = 0;
  await requireAdmin({user:{id:'000000000000000000000002'}}, response, () => admitted++);
  assert.equal(response.statusCode, 404);
  assert.equal(admitted, 0);
  await requireAdmin({user:{id:process.env.ADMIN_USER_IDS}}, response, () => admitted++);
  assert.equal(admitted, 1);
});

test('Track Here Render deployment uses the two approved IDs when the service has no override', async () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.RENDER_EXTERNAL_HOSTNAME = 'trackhere-api.onrender.com';
    delete process.env.ADMIN_USER_IDS;
    async function admitted(id) {
      let allowed = false;
      await requireAdmin({ user: { id } }, { status() { return this; }, json() {} }, () => { allowed = true; });
      return allowed;
    }
    const first = '6af5d00f4262d1c164689fee';
    assert.equal(await admitted(first), true);
    assert.equal(await admitted('6b05e161ea773812dc73dd0b'), true);
    assert.equal(await admitted('000000000000000000000003'), false);
    process.env.ADMIN_USER_IDS = '';
    assert.equal(await admitted(first), false);
    delete process.env.ADMIN_USER_IDS;
    process.env.RENDER_EXTERNAL_HOSTNAME = 'another-service.onrender.com';
    assert.equal(await admitted(first), false);
  } finally {
    for (const key of ['NODE_ENV', 'RENDER_EXTERNAL_HOSTNAME', 'ADMIN_USER_IDS']) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
