import ApiError from '../utils/ApiError.js';
import env from './env.js';

export const allowedOrigins = [
  env.CLIENT_URL,
  'https://track-here.vercel.app',
  'https://track-here.beta-001.workers.dev',
  ...(env.CLIENT_URLS ? env.CLIENT_URLS.split(',').map((s) => s.trim()) : []),
  ...(env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    : []),
].filter(Boolean);

export const isOriginAllowed = (origin) => origin === undefined || allowedOrigins.includes(origin);

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(ApiError.forbidden('Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Account-Id'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400, // 24 hours
};

export default corsOptions;
