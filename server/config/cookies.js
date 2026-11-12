// server/config/cookies.js: one place for every auth cookie
const prod = process.env.NODE_ENV === 'production';

export const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: prod, // HTTPS only in production
  sameSite: process.env.COOKIE_SAME_SITE || (prod && !process.env.COOKIE_DOMAIN ? 'none' : 'lax'),
  path: '/',
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  maxAge: maxAgeMs,
});

