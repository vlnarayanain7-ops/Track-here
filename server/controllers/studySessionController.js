import { preserveArchivedStudy } from '../services/streakService.js';
import Task from '../models/Task.js';
import { z } from 'zod';
import StudySession from '../models/StudySession.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';
import { defaultSessionName } from '../utils/sessionName.js';
import { applySession, checkMilestones } from '../lib/milestones.js';

// ─── Validation Schemas ───────────────────────────────────────

const categorySchema = z.string().trim().max(100, 'Subject must be at most 100 characters').optional();

const sessionDateSchema = z.coerce.date().min(new Date('1970-01-01')).refine(
  date => date.getTime() <= Date.now() + 300000, 'Session date is in the future');

export const createSessionSchema = z.object({
  category: categorySchema,
  activityType: z.enum(['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice']).optional(),
  topic: z.string().trim().max(80).optional(),
  subtopic: z.string().trim().optional(),
  date: sessionDateSchema.optional(),
  startTime: sessionDateSchema.optional().nullable(),
  endTime: sessionDateSchema.optional().nullable(),
  focusDuration: z.number().max(1440).min(0, 'Focus duration must be non-negative'),
  duration: z.number().optional().nullable(),
  durationSec: z.number().min(0).max(86400).optional().nullable(),
  startedAt: sessionDateSchema.optional().nullable(),
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
});

export const updateSessionSchema = createSessionSchema.omit({ clientId: true }).partial();

export const startTimerSchema = z.object({
  clientId: z.string().min(1).max(128).optional(),
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
export const createSession = asyncHandler(async (req, res, next) => {
  if (req.body.linkedTask && !await Task.exists({ _id: req.body.linkedTask, user: req.user.id })) {
    throw ApiError.notFound('Linked task not found');
  }
  if (req.body.clientId) {
    const existing = await StudySession.findOne({ user: req.user.id, clientId: req.body.clientId });
    if (existing?.activeTimerKey === 'active') {
      req.params.id = existing.id;
      return finishTimer(req, res, next);
    }
    if (existing) {
      await applySession(req.user, existing);
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
    category: req.body.category || 'Focus',
    activityType: req.body.activityType || 'Problem Solving',
    topic,
    user: req.user.id,
    date: sessionDate,
    source: 'manual',
    heartbeatOk: false,
    durationSec,
    startedAt: req.body.startedAt
      ? new Date(req.body.startedAt)
      : (req.body.startTime ? new Date(req.body.startTime) : sessionDate),
    subjectName: subName || 'Focus',
  };

  if (req.body.startTime) sessionData.startTime = new Date(req.body.startTime);
  if (req.body.endTime) sessionData.endTime = new Date(req.body.endTime);

  await preserveArchivedStudy(req.user.id);
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
  await preserveArchivedStudy(req.user.id);
  const updateData = { ...req.body };
  if (updateData.linkedTask && !await Task.exists({ _id: updateData.linkedTask, user: req.user.id })) throw ApiError.notFound('Linked task not found');
  if (updateData.durationSec != null) updateData.focusDuration = Math.round(updateData.durationSec / 60);
  else if (updateData.focusDuration != null) updateData.durationSec = Math.round(updateData.focusDuration * 60);
  if (updateData.date && !updateData.startedAt) updateData.startedAt = updateData.date;
  if (updateData.date) updateData.date = new Date(updateData.date);
  if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
  if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);

  const editableMetadata = ['topic', 'subtopic', 'category', 'activityType', 'linkedTask', 'keyLearnings', 'nextAction',
    'mistakes', 'videoDuration', 'problemsAttempted', 'problemsSolved', 'problemsSolvedIndependently'];
  const filter = { _id: req.params.id, user: req.user.id, 'timerState.status': { $nin: ['running', 'paused'] } };
  if (Object.keys(updateData).some(key => !editableMetadata.includes(key))) {
    filter.isTimerSession = { $ne: true };
    filter.heartbeatOk = { $ne: true };
  }
  if (updateData.category) updateData.subjectName = updateData.category;
  const session = await StudySession.findOneAndUpdate(
    filter,
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
  await preserveArchivedStudy(req.user.id);
  const session = await StudySession.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!session) throw ApiError.notFound('Study session not found');
  if (session.heartbeatOk) await checkMilestones(req.user.id, req.user.timezone || 'Asia/Kolkata');
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
  if (req.body.clientId && activeSession?.clientId === req.body.clientId) {
    return res.json({ success: true, data: { session: activeSession } });
  }
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
    ...(req.params.id ? { _id: req.params.id } : {}),
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
  const session = await StudySession.findOneAndUpdate({ ...query, lastHeartbeatAt: current.lastHeartbeatAt }, {
    $inc: { verifiedSeconds: observedGap(current.lastHeartbeatAt, now) },
    $set: {
      lastHeartbeatAt: now,
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
      lastHeartbeatAt: now,
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
  await preserveArchivedStudy(req.user.id);
  const localSeconds = req.body?.durationSec;
  const cappedDuration = Math.min(accumulatedDuration, 6 * 3600, Number.isFinite(localSeconds) ? Math.max(0, localSeconds) : Infinity);
  if (req.body?.linkedTask && await Task.exists({ _id: req.body.linkedTask, user: req.user.id })) extra.linkedTask = req.body.linkedTask;
  const coverage = (current.verifiedSeconds || 0) + (current.timerState.status === 'running' ? observedGap(current.lastHeartbeatAt, now) : 0);
  const reportedSeconds = Number.isFinite(localSeconds) ? Math.min(86400, Math.max(0, localSeconds)) : cappedDuration;
  const heartbeatOk = coverage >= 0.9 * Math.max(accumulatedDuration, reportedSeconds);
  const durationSec = heartbeatOk ? cappedDuration : reportedSeconds;

  const session = await StudySession.findOneAndUpdate(query, {
    $set: {
      ...extra,
      activeTimerKey: null,
      endTime: now,
      'timerState.status': 'completed',
      'timerState.pausedAt': null,
      'timerState.totalPausedDuration': totalPausedDuration,
      'timerState.accumulatedDuration': cappedDuration,
      focusDuration: Math.round(durationSec / 60),
      durationSec,
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
function observedGap(previous, now) {
  const seconds = (now - previous) / 1000;
  return seconds >= 0 && seconds <= 75 ? seconds : 0;
}

export const heartbeatTimer = asyncHandler(async (req, res, next) => {
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
    req.params.id = current.id;
    return finishTimer(req, res, next);
  }

  if (now - current.lastHeartbeatAt >= 30000) {
    await StudySession.updateOne({ ...query, _id: current._id, lastHeartbeatAt: current.lastHeartbeatAt },
      { $inc: { verifiedSeconds: observedGap(current.lastHeartbeatAt, now) }, $set: { lastHeartbeatAt: now } });
  }

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
