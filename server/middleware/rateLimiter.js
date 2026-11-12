// server/middleware/rateLimiter.js: fail closed
import rateLimit from 'express-rate-limit';

const off = process.env.DISABLE_RATE_LIMIT === 'true';
if (off && process.env.NODE_ENV === 'production') {
  throw new Error('DISABLE_RATE_LIMIT must not be true in production');
}

const noop = (_req, _res, next) => next();

const make = (windowMs, limit, message) =>
  off
    ? noop
    : rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: message || 'Too many requests, please slow down.',
        },
      });

export const authLimiter = make(15 * 60 * 1000, 20, 'Too many authentication attempts, please try again later.');
export const apiLimiter = make(15 * 60 * 1000, 500, 'Too many requests, please try again later.');
export const searchLimiter = make(60 * 1000, 100, 'Too many search requests, please slow down.');
export const feedbackLimiter = off
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { keyGeneratorIpFallback: false },
      keyGenerator: (req) => req.user?.id || req.ip,
      message: {
        success: false,
        message: 'Too many feedback requests, please wait a minute.',
      },
    });
