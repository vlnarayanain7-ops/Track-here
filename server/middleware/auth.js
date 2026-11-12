import { verifyAccessToken } from '../utils/tokens.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

/**
 * Authentication middleware.
 * Extracts JWT from cookie or Authorization header, verifies it,
 * checks user existence, and attaches req.user = { id: userId }.
 */
const auth = async (req, res, next) => {
  try {
    // Try cookie first, then Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw ApiError.unauthorized('Access token missing');
    }

    const decoded = verifyAccessToken(token);
    const userExists = await User.exists({ _id: decoded.userId });
    if (!userExists) {
      throw ApiError.unauthorized('Account no longer exists. Please sign in again.');
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(ApiError.unauthorized('Authentication failed'));
  }
};

export const authenticateOptional = (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = { id: decoded.userId };
    }
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
};

export const authenticate = auth;
export default auth;
