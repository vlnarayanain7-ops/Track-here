import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendMail, mailConfigured } from './mailer.js';

test('production mail validates configuration and submits safely to Brevo', async () => {
  const original = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.BREVO_API_KEY;
    delete process.env.MAIL_FROM_EMAIL;
    assert.equal(mailConfigured(), false);
    await assert.rejects(sendMail({}), /mail_not_configured/);
    process.env.BREVO_API_KEY = 'test-key';
    process.env.MAIL_FROM_EMAIL = 'sender@example.com';
    assert.equal(mailConfigured(), true);
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
      const body = JSON.parse(options.body);
      assert.equal(body.sender.email, 'sender@example.com');
      assert.equal(body.to[0].email, 'student@example.com');
      assert.match(body.textContent, /reset-password/);
      return { ok: true };
    };
    await sendMail({ to: ' student@example.com ', subject: 'Reset', text: 'https://example.com/reset-password/test' });
    globalThis.fetch = async () => ({ ok: false, status: 401 });
    await assert.rejects(sendMail({ to: 'student@example.com' }), /^Error: mail_failed_401$/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ['NODE_ENV', 'BREVO_API_KEY', 'MAIL_FROM_EMAIL']) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});
