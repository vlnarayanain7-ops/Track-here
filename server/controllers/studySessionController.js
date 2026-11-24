import Task from '../models/Task.js';
import { z } from 'zod';
import StudySession from '../models/StudySession.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';
import { defaultSessionName } from '../utils/sessionName.js';
import { applySession } from '../lib/milestones.js';

// ─── Validation Schemas ───────────────────────────────────────

const categorySchema = z.string().trim().max(100, 'Subject must be at most 100 characters').optional();

export const createSessionSchema = z.object({
  category: categorySchema.default('Focus'),
  activityType: z.enum(['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice']).optional().default('Problem Solving'),
  topic: z.string().trim().max(80).optional(),
  subtopic: z.string().trim().optional(),
  date: z.string().or(z.date()).optional().default(() => new Date().toISOString()),
  startTime: z.string().or(z.date()).optional().nullable(),
  endTime: z.string().or(z.date()).optional().nullable(),
  focusDuration: z.number().min(0, 'Focus duration must be non-negative'),
  duration: z.number().optional().nullable(),
  durationSec: z.number().optional().nullable(),
  startedAt: z.string().or(z.date()).optional().nullable(),
  source: z.string().optional(),
  clientId: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  subjectName: z.string().optional().nullable(),
  videoDuration: z.number().min(0).optional(),
  problemsAttempted: z.number().min(0).optional(),
  problemsSolved: z.number().min(0).optional(),
  problemsSolvedIndependently: z.number().min(0).optional(),
  mistakes: z.string().optional().nullable(),
  keyLearnings: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  linkedTask: z.string().optional().nullable(),
}).passthrough();

export const updateSessionSchema = createSessionSchema.partial().passthrough();

export const startTimerSchema = z.object({
  category: categorySchema,
  activityType: z.enum(['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice']).optional(),
  topic: z.string().trim().max(80).optional(),
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
      .populate('linkedTask', 'title status')
      .lean(),
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
  if (req.body.linkedTask && !await Task.exists({ _id: req.body.linkedTask, user: req.user.id })) {
    throw ApiError.notFound('Linked task not found');
  }
  if (req.body.clientId) {
    const existing = await StudySession.findOne({ user: req.user.id, clientId: req.body.clientId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Study session already exists',
        data: { session: existing },
      });
    }
  }

  const sessionDate = req.body.date ? new Date(req.body.date) : new Date();
  const tz = req.user?.timezone || 'Asia/Kolkata';
  const subName = req.body.category && req.body.category !== 'Focus' ? req.body.category : null;
  const topic = req.body.topic?.trim() || defaultSessionName(sessionDate, tz, subName);
  const durationSec = req.body.durationSec != null
    ? Number(req.body.durationSec)
    : Math.round((Number(req.body.focusDuration) || 0) * 60);

  const sessionData = {
    ...req.body,
    topic,
    user: req.user.id,
    date: sessionDate,
    source: req.body.source || 'manual',
    heartbeatOk: req.body.heartbeatOk ?? false,
    durationSec,
    startedAt: req.body.startedAt
      ? new Date(req.body.startedAt)
      : (req.body.startTime ? new Date(req.body.startTime) : sessionDate),
    subjectName: subName || 'Focus',
  };

  if (req.body.startTime) sessionData.startTime = new Date(req.body.startTime);
  if (req.body.endTime) sessionData.endTime = new Date(req.body.endTime);

  const session = await StudySession.create(sessionData);
  await applySession(req.user, session);
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
    { returnDocument: 'after', runValidators: true }
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

  // A timer is a single active resource per user. Do not silently complete an
  // existing timer when a double-click or another device races to start one:
  // that both loses time and lets two successful starts report different state.
  const activeSession = await StudySession.findOne({
    user: req.user.id,
    isTimerSession: true,
    'timerState.status': { $in: ['running', 'paused'] },
  });
  if (activeSession) {
    throw ApiError.conflict('A timer is already active. Resume, finish, or cancel it before starting another.');
  }

  const category = req.body.category || 'Focus';
  const tz = req.user?.timezone || 'Asia/Kolkata';
  const subName = category !== 'Focus' ? category : null;
  const topic = req.body.topic?.trim() || defaultSessionName(now, tz, subName);

  const session = await StudySession.create({
    user: req.user.id,
    category,
    activityType: req.body.activityType || 'Problem Solving',
    topic,
    subtopic: req.body.subtopic,
    date: now,
    startTime: now,
    startedAt: now,
    focusDuration: 0,
    durationSec: 0,
    isTimerSession: true,
    source: 'timer',
    heartbeatOk: false,
    heartbeats: [now],
    lastHeartbeatAt: now,
    subjectName: subName || 'Focus',
    clientId: req.body.clientId,
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
    isTimerSession: true,
    'timerState.status': { $in: ['running', 'paused'] },
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
  for (const field of ['problemsAttempted', 'problemsSolved', 'problemsSolvedIndependently', 'mistakes', 'keyLearnings', 'nextAction', 'videoDuration', 'category', 'topic']) {
    if (req.body?.[field] != null) extra[field] = req.body[field];
  }

  // Ensure topic has an automatic unique name if not provided
  if (!extra.topic && (!current.topic || current.topic === 'Focus session' || current.topic === 'Focus')) {
    const tz = req.user?.timezone || 'Asia/Kolkata';
    const subName = (extra.category || current.category) !== 'Focus' ? (extra.category || current.category) : null;
    extra.topic = defaultSessionName(current.startTime || current.timerState?.startedAt || now, tz, subName);
  }
  const clientMins = Number(req.body?.focusDuration);
  const computedMins = accumulatedDuration >= 20 ? Math.max(1, Math.round(accumulatedDuration / 60)) : Math.floor(accumulatedDuration / 60);
  const finalFocusDuration = !isNaN(clientMins) && clientMins > 0 ? Math.max(clientMins, computedMins) : computedMins;

  const cappedDuration = Math.min(accumulatedDuration, 6 * 3600);
  const heartbeatsCount = (current.heartbeats?.length || 0) + 1;
  const heartbeatOk = cappedDuration <= 60
    ? (heartbeatsCount >= 1)
    : (heartbeatsCount * 60 >= 0.9 * cappedDuration);

  const session = await StudySession.findOneAndUpdate(query, {
    $set: {
      ...extra,
      activeTimerKey: null,
      endTime: now,
      'timerState.status': 'completed',
      'timerState.pausedAt': null,
      'timerState.totalPausedDuration': totalPausedDuration,
      'timerState.accumulatedDuration': cappedDuration,
      focusDuration: finalFocusDuration,
      durationSec: cappedDuration,
      source: 'timer',
      heartbeatOk,
      startedAt: current.timerState?.startedAt || current.startTime || now,
      subjectName: extra.category || current.category || 'Focus',
      lastHeartbeatAt: now,
    },
    $push: { heartbeats: now },
  }, { returnDocument: 'after' });

  if (!session) throw ApiError.badRequest('Timer is already completed or was changed by another device');
  await applySession(req.user, session);
  emitToUser(req.user.id, 'timer:finished', session);
  emitToUser(req.user.id, 'session:created', session);

  res.json({
    success: true,
    message: 'Timer session completed',
    data: { session },
  });
});

/**
 * POST /api/study-sessions/timer/heartbeat
 */
export const heartbeatTimer = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = req.params.id
    ? { _id: req.params.id, user: req.user.id, isTimerSession: true, 'timerState.status': 'running' }
    : { user: req.user.id, isTimerSession: true, 'timerState.status': 'running' };

  const current = await StudySession.findOne(query);
  if (!current) {
    return res.json({ ok: false, message: 'No running timer found' });
  }

  const started = current.timerState?.startedAt || current.startTime || current.createdAt;
  const currentElapsed = Math.max(0, Math.floor((now - started) / 1000) - (current.timerState?.totalPausedDuration || 0));

  // A timer running over 6 hours is closed at 6 hours
  if (currentElapsed >= 6 * 3600) {
    const cappedDuration = 6 * 3600;
    const heartbeatsCount = (current.heartbeats?.length || 0) + 1;
    const heartbeatOk = heartbeatsCount * 60 >= 0.9 * cappedDuration;
    const finalFocusMinutes = Math.round(cappedDuration / 60);

    current.activeTimerKey = null;
    current.timerState.status = 'completed';
    current.timerState.accumulatedDuration = cappedDuration;
    current.endTime = now;
    current.focusDuration = finalFocusMinutes;
    current.durationSec = cappedDuration;
    current.source = 'timer';
    current.heartbeatOk = heartbeatOk;
    current.heartbeats.push(now);
    current.lastHeartbeatAt = now;
    await current.save();

    await applySession(req.user, current);
    emitToUser(req.user.id, 'timer:finished', current);

    return res.json({
      ok: true,
      autoClosed: true,
      message: 'Timer reached maximum duration of 6 hours and was closed.',
      session: current,
    });
  }

  current.heartbeats = current.heartbeats || [];
  current.heartbeats.push(now);
  current.lastHeartbeatAt = now;
  await current.save();

  res.json({ ok: true, active: true });
});

/**
 * GET /api/study-sessions/timer/active
 */
export const getActiveTimer = asyncHandler(async (req, res) => {
  const session = await StudySession.findOne({
    user: req.user.id,
    isTimerSession: true,
    'timerState.status': { $in: ['running', 'paused'] },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { session: session || null },
  });
});
