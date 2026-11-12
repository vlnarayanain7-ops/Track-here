import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

/**
 * Generate a short-lived JWT access token.
 * @param {string} userId
 * @returns {string} JWT
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

/**
 * Verify a JWT access token.
 * @param {string} token
 * @returns {{ userId: string }}
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

/**
 * Generate a unique refresh token (UUID, not JWT).
 * @returns {string}
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString('base64url');
};

export const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const generateCsrfToken = () => crypto.randomBytes(32).toString('base64url');

import { cookieOptions } from '../config/cookies.js';

/**
 * Set auth cookies on the response.
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
};

/**
 * Clear auth cookies.
 */
export const clearAuthCookies = (res) => {
  const opts = cookieOptions(0);
  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', opts);
  res.clearCookie('csrfToken', { ...opts, httpOnly: false });
};

export const setCsrfCookie = (res, csrfToken) => {
  const opts = cookieOptions(7 * 24 * 60 * 60 * 1000);
  res.cookie('csrfToken', csrfToken, {
    ...opts,
    httpOnly: false, // Double submit CSRF cookie
  });
};
