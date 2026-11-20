import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';

const readEnv = file => existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
const server = { ...readEnv('.env'), ...readEnv('server/.env'), ...process.env };
const client = { ...readEnv('client/.env'), ...readEnv('client/.env.production'), ...readEnv('client/.env.local'), ...readEnv('client/.env.production.local'), ...process.env };
const checks = [
  ['Password-reset provider key', Boolean(server.BREVO_API_KEY?.trim())],
  ['Password-reset sender address', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(server.MAIL_FROM_EMAIL || '')],
  ['Reset links use the live website', server.CLIENT_URL?.replace(/\/$/, '') === 'https://track-here.beta-001.workers.dev'],
  ['Frontend error reporting', /^https:\/\/[^@]+@[^/]+\/.+/.test(client.VITE_SENTRY_DSN || '')],
  ['Social preview image', existsSync('client/public/social-preview.png')],
];
console.log('Local configuration only; deployed settings and actual delivery require separate verification.');
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'MISSING'}: ${label}`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
