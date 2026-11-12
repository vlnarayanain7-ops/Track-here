import http from 'http';
import mongoose from 'mongoose';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import env from './config/env.js';
import corsOptions from './config/cors.js';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import { startNotificationCrons } from './services/notificationService.js';
import { initSocket } from './services/socketService.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studySessionRoutes from './routes/studySessions.js';
import taskRoutes from './routes/tasks.js';
import noteRoutes from './routes/notes.js';
import problemRoutes from './routes/problems.js';
import dailyPlanRoutes from './routes/dailyPlans.js';
import dailyReviewRoutes from './routes/dailyReviews.js';
import revisionRoutes from './routes/revisions.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import searchRoutes from './routes/search.js';
import mockTestRoutes from './routes/mockTests.js';
import timetableRoutes from './routes/timetable.js';
import feedbackRoutes from './routes/feedback.js';

const app = express();

// Required behind Render's reverse proxy so secure cookies and request IPs are handled correctly.
app.set('trust proxy', 1);

// ─── Core Middleware ──────────────────────────────────────────

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply general rate limiter to /api
app.use('/api', apiLimiter);

// ─── Root & Health Check ──────────────────────────────────────

app.get('/', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    name: 'Track Here — Study OS Backend API',
    status: dbConnected ? 'healthy' : 'degraded',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      studySessions: '/api/study-sessions',
      tasks: '/api/tasks',
      notes: '/api/notes',
      problems: '/api/problems',
      dailyPlans: '/api/daily-plans',
      dailyReviews: '/api/daily-reviews',
      revisions: '/api/revisions',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      search: '/api/search',
      mockTests: '/api/mock-tests',
      timetable: '/api/timetable',
    },
    clientUrl: env.CLIENT_URL,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  const healthData = {
    status: dbConnected ? 'healthy' : 'unhealthy',
    database: {
      status: dbStates[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  };

  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      ...healthData,
    });
  }

  res.json({
    success: true,
    ...healthData,
  });
});

// ─── Mount Routes ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/daily-plans', dailyPlanRoutes);
app.use('/api/daily-reviews', dailyReviewRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── 404 & Error Handling ─────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

// ─── Server Startup ───────────────────────────────────────────

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Track Here Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`📡 Client URL: ${env.CLIENT_URL}`);
      console.log(`⚡ Real-time WebSocket engine active`);

      // Start notification scheduler crons
      startNotificationCrons();
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export { httpServer, io };
export default app;

