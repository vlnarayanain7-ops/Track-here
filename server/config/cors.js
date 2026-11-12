import env from './env.js';

export const allowedOrigins = [
  env.CLIENT_URL,
  ...(env.CLIENT_URLS ? env.CLIENT_URLS.split(',').map((s) => s.trim()) : []),
  ...(env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    : []),
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400, // 24 hours
};

export default corsOptions;
