import { z } from 'zod';
import StudySession from '../models/StudySession.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

// ─── Validation Schemas ───────────────────────────────────────

const categorySchema = z.string().trim().min(1, 'Subject is required').max(100, 'Subject must be at most 100 characters');

export const createSessionSchema = z.object({
  // Categories are user-configured subjects (for example Physics, Botany, or DSA),
  // not a fixed programming-only taxonomy.
  category: categorySchema,
  activityType: z.enum(['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice']),
  topic: z.string().trim().min(1, 'Topic is required'),
  subtopic: z.string().trim().optional(),
  date: z.string().or(z.date()).optional().default(() => new Date().toISOString()),
  startTime: z.string().or(z.date()).optional().nullable(),
  endTime: z.string().or(z.date()).optional().nullable(),
  focusDuration: z.number().min(0, 'Focus duration must be non-negative'),
  videoDuration: z.number().min(0).optional(),
  problemsAttempted: z.number().min(0).optional(),
  problemsSolved: z.number().min(0).optional(),
  problemsSolvedIndependently: z.number().min(0).optional(),
  mistakes: z.string().optional().nullable(),
  keyLearnings: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  linkedTask: z.string().optional().nullable(),
}).strict();

export const updateSessionSchema = createSessionSchema.partial().strict();

export const startTimerSchema = z.object({
  category: categorySchema,
  activityType: z.enum(['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice']),
  topic: z.string().trim().min(1, 'Topic is required'),
  subtopic: z.string().trim().optional(),
}).strict();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/study-sessions
 */
export const getSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, activityType, startDate, endDate, sort = '-date' } = req.query;

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const safeSort = typeof sort === 'string' ? sort : '-date';

  const query = { user: req.user.id };

  if (typeof category === 'string' && category) query.category = category;
  if (typeof activityType === 'string' && activityType) query.activityType = activityType;
  if (typeof startDate === 'string' && !isNaN(Date.parse(startDate))) {
    query.date = query.date || {};
    query.date.$gte = new Date(startDate);
  }
  if (typeof endDate === 'string' && !isNaN(Date.parse(endDate))) {
    query.date = query.date || {};
    query.date.$lte = new Date(endDate);
  }

  const skip = (safePage - 1) * safeLimit;

  const [sessions, total] = await Promise.all([
    StudySession.find(query)
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit)
      .populate('linkedTask', 'title status'),
    StudySession.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    },
  });
});

/**
 * POST /api/study-sessions
 */
export const createSession = asyncHandler(async (req, res) => {
  const sessionData = {
    ...req.body,
    user: req.user.id,
    date: new Date(req.body.date),
  };

  if (req.body.startTime) sessionData.startTime = new Date(req.body.startTime);
  if (req.body.endTime) sessionData.endTime = new Date(req.body.endTime);

  const session = await StudySession.create(sessionData);
  emitToUser(req.user.id, 'session:created', session);

  res.status(201).json({
    success: true,
    message: 'Study session created',
    data: { session },
  });
});

/**
 * GET /api/study-sessions/:id
 */
export const getSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate('linkedTask', 'title status');

  if (!session) throw ApiError.notFound('Study session not found');

  res.json({
    success: true,
    data: { session },
  });
});

/**
 * PUT /api/study-sessions/:id
 */
export const updateSession = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.date) updateData.date = new Date(updateData.date);
  if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
  if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);

  const session = await StudySession.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!session) throw ApiError.notFound('Study session not found');
  emitToUser(req.user.id, 'session:updated', session);

  res.json({
    success: true,
    message: 'Study session updated',
    data: { session },
  });
});

/**
 * DELETE /api/study-sessions/:id
 */
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!session) throw ApiError.notFound('Study session not found');
  emitToUser(req.user.id, 'session:deleted', { _id: req.params.id });

  res.json({
    success: true,
    message: 'Study session deleted',
  });
});

/**
 * POST /api/study-sessions/timer/start
 */
export const startTimer = asyncHandler(async (req, res) => {
  const now = new Date();

  // Clear any existing active timer sessions for this user so they are never blocked by 409
  await StudySession.updateMany(
    { user: req.user.id, activeTimerKey: 'active' },
    {
      $set: {
        activeTimerKey: null,
        'timerState.status': 'completed',
        endTime: now,
      },
    }
  );

  const session = await StudySession.create({
    user: req.user.id,
    category: req.body.category || 'Focus',
    activityType: req.body.activityType || 'Problem Solving',
    topic: req.body.topic || 'Focus session',
    subtopic: req.body.subtopic,
    date: now,
    startTime: now,
    focusDuration: 0,
    isTimerSession: true,
    activeTimerKey: 'active',
    timerState: {
      status: 'running',
      startedAt: now,
      totalPausedDuration: 0,
      accumulatedDuration: 0,
    },
  });

  emitToUser(req.user.id, 'timer:started', session);

  res.status(201).json({
    success: true,
    message: 'Timer started',
    data: { session },
  });
});

/**
 * POST /api/study-sessions/timer/cancel
 */
export const cancelTimer = asyncHandler(async (req, res) => {
  await StudySession.deleteMany({
    user: req.user.id,
    activeTimerKey: 'active',
  });
  emitToUser(req.user.id, 'timer:cancelled', {});
  res.json({
    success: true,
    message: 'Timer cancelled',
  });
});

/**
 * PUT /api/study-sessions/timer/:id/pause (or POST /timer/pause)
 */
export const pauseTimer = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = req.params.id
    ? { _id: req.params.id, user: req.user.id, isTimerSession: true, 'timerState.status': 'running' }
    : { user: req.user.id, isTimerSession: true, 'timerState.status': 'running' };
  const current = await StudySession.findOne(query).lean();
  if (!current) throw ApiError.badRequest('Timer is not running or was already changed');
  const accumulatedDuration = Math.max(
    0,
    Math.floor((now - current.timerState.startedAt) / 1000) - (current.timerState.totalPausedDuration || 0)
  );
  const session = await StudySession.findOneAndUpdate(query, {
    $set: {
      'timerState.status': 'paused',
      'timerState.pausedAt': now,
      'timerState.accumulatedDuration': accumulatedDuration,
    },
  }, { returnDocument: 'after' });

  if (!session) throw ApiError.badRequest('Timer is not running or was already changed');
  emitToUser(req.user.id, 'timer:paused', session);

  res.json({
    success: true,
    message: 'Timer paused',
    data: { session },
  });
});

/**
 * PUT /api/study-sessions/timer/:id/resume (or POST /timer/resume)
 */
export const resumeTimer = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = req.params.id
    ? { _id: req.params.id, user: req.user.id, isTimerSession: true, 'timerState.status': 'paused' }
    : { user: req.user.id, isTimerSession: true, 'timerState.status': 'paused' };
  const current = await StudySession.findOne(query).lean();
  if (!current) throw ApiError.badRequest('Timer is not paused or was already changed');
  const pausedDuration = Math.max(0, Math.floor((now - current.timerState.pausedAt) / 1000));
  const session = await StudySession.findOneAndUpdate(query, {
    $set: {
      'timerState.status': 'running',
      'timerState.pausedAt': null,
      'timerState.totalPausedDuration': (current.timerState.totalPausedDuration || 0) + pausedDuration,
    },
  }, { returnDocument: 'after' });

  if (!session) throw ApiError.badRequest('Timer is not paused or was already changed');
  emitToUser(req.user.id, 'timer:resumed', session);

  res.json({
    success: true,
    message: 'Timer resumed',
    data: { session },
  });
});

/**
 * PUT /api/study-sessions/timer/:id/finish (or POST /timer/finish)
 */
export const finishTimer = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = req.params.id
    ? { _id: req.params.id, user: req.user.id, isTimerSession: true, 'timerState.status': { $in: ['running', 'paused'] } }
    : { user: req.user.id, isTimerSession: true, 'timerState.status': { $in: ['running', 'paused'] } };
  const current = await StudySession.findOne(query).lean();
  if (!current) throw ApiError.badRequest('Timer is already completed or was changed by another device');
  const currentPause = current.timerState.status === 'paused' && current.timerState.pausedAt
    ? Math.max(0, Math.floor((now - current.timerState.pausedAt) / 1000))
    : 0;
  const totalPausedDuration = (current.timerState.totalPausedDuration || 0) + currentPause;
  const accumulatedDuration = Math.max(0, Math.floor((now - current.timerState.startedAt) / 1000) - totalPausedDuration);
  const extra = {};
  for (const field of ['problemsAttempted', 'problemsSolved', 'problemsSolvedIndependently', 'mistakes', 'keyLearnings', 'nextAction', 'videoDuration']) {
    if (req.body?.[field] != null) extra[field] = req.body[field];
  }
  const session = await StudySession.findOneAndUpdate(query, {
    $set: {
      ...extra,
      activeTimerKey: null,
      endTime: now,
      'timerState.status': 'completed',
      'timerState.pausedAt': null,
      'timerState.totalPausedDuration': totalPausedDuration,
      'timerState.accumulatedDuration': accumulatedDuration,
      focusDuration: Math.floor(accumulatedDuration / 60),
    },
  }, { returnDocument: 'after' });

  if (!session) throw ApiError.badRequest('Timer is already completed or was changed by another device');
  emitToUser(req.user.id, 'timer:finished', session);
  emitToUser(req.user.id, 'session:created', session);

  res.json({
    success: true,
    message: 'Timer session completed',
    data: { session },
  });
});

/**
 * GET /api/study-sessions/timer/active
 */
export const getActiveTimer = asyncHandler(async (req, res) => {
  const session = await StudySession.findOne({
    user: req.user.id,
    isTimerSession: true,
    'timerState.status': { $in: ['running', 'paused'] },
  });

  res.json({
    success: true,
    data: { session: session || null },
  });
});
