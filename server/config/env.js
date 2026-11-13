import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Fail fast: strictly require core environment variables
const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL'];
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing env var ${k}`);
}

for (const k of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  if (process.env[k].length < 32) throw new Error(`${k} must be at least 32 characters`);
}

if (process.env.DISABLE_RATE_LIMIT === 'true' && process.env.NODE_ENV === 'production') {
  throw new Error('DISABLE_RATE_LIMIT must not be true in production');
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/trackhere_test',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  CLIENT_URLS: process.env.CLIENT_URLS || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  BREVO_API_KEY: process.env.BREVO_API_KEY || undefined,
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || undefined,
  DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT === 'true',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_EMAIL: process.env.VAPID_EMAIL || 'mailto:admin@trackhere.app',
};

export default env;
