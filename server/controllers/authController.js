import { z } from 'zod';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generateCsrfToken,
  setAuthCookies,
  setCsrfCookie,
  clearAuthCookies,
} from '../utils/tokens.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { sendMail } from '../services/mailer.js';
import crypto from 'crypto';

// ─── Validation Schemas ───────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  ageBand: z.enum(['under13', '13_17', '18_plus']).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─── Controllers ──────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, ageBand } = req.body;

  if (ageBand === 'under13') {
    throw ApiError.badRequest('Track Here is for ages 13 and up.');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    ageBand: ageBand === '13_17' ? '13_17' : '18_plus',
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken();

  // Store refresh session
  await RefreshSession.create({
    user: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    familyId: crypto.randomUUID(),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user, csrfToken, accessToken },
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken();

  // Store refresh session
  await RefreshSession.create({
    user: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    familyId: crypto.randomUUID(),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);

  // Remove password from response
  user.password = undefined;

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: { user, csrfToken, accessToken },
  });
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    // Revoke the refresh session
    await RefreshSession.findOneAndUpdate({ tokenHash: hashRefreshToken(refreshToken), revokedAt: null }, { $set: { revokedAt: new Date() } });
  }

  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/auth/refresh
 * Rotate the refresh token.
 */
export const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;

  if (!oldRefreshToken) {
    throw ApiError.unauthorized('Refresh token missing');
  }

  const tokenHash = hashRefreshToken(oldRefreshToken);
  const now = new Date();
  // Atomically revoke the presented token. Only one concurrent refresh can win.
  const session = await RefreshSession.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now } },
    { returnDocument: 'after' }
  );
  if (!session) {
    // A previously used token indicates replay. Revoke the complete token family.
    const reusedSession = await RefreshSession.findOne({ tokenHash });
    if (reusedSession) {
      await RefreshSession.updateMany({ user: reusedSession.user, familyId: reusedSession.familyId }, { $set: { revokedAt: now } });
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Generate new tokens
  const accessToken = generateAccessToken(session.user.toString());
  const newRefreshToken = generateRefreshToken();

  // Store new refresh session
  await RefreshSession.create({
    user: session.user,
    tokenHash: hashRefreshToken(newRefreshToken),
    familyId: session.familyId,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Set new cookies
  setAuthCookies(res, accessToken, newRefreshToken);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);

  res.json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: { csrfToken },
  });
});

/** GET /api/auth/csrf */
export const getCsrfToken = asyncHandler(async (req, res) => {
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);
  res.json({ success: true, data: { csrfToken } });
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({
    success: true,
    data: { user },
  });
});

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  const user = await User.findOne({ email }).select('_id email');

  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = sha(token);
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await User.updateOne(
      { _id: user._id },
      {
        resetTokenHash: tokenHash,
        resetTokenExpires: expires,
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expires,
      }
    );

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const link = `${baseUrl}/reset-password/${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your Track Here password',
      text: `Open this link within 30 minutes:\n${link}\n\nIf you did not ask for this, ignore this email.`,
    }).catch((e) => console.error('mail_failed', e.message));
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  });
});

/**
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const tokenHash = sha(token);
  const now = new Date();

  const user = await User.findOne({
    $or: [
      { resetTokenHash: tokenHash, resetTokenExpires: { $gt: now } },
      { resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: now } },
    ],
  }).select('+password');

  if (!user) {
    return res.status(400).json({
      error: 'invalid_or_expired',
      message: 'This link is invalid or has expired.',
    });
  }

  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Revoke all refresh sessions on every device
  await RefreshSession.deleteMany({ user: user._id });

  res.json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
  });
});
