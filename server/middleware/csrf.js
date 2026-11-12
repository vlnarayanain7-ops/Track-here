import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF protection for cookie-authenticated state changes.
 * The client sends the non-HTTP-only csrfToken cookie back in X-CSRF-Token.
 */
const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get('X-CSRF-Token');
  if (!cookieToken || !headerToken) {
    return next(ApiError.forbidden('CSRF token missing'));
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    return next(ApiError.forbidden('CSRF token invalid'));
  }

  next();
};

export default csrfProtection;