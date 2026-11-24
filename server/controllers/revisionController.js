import { calculateNextInterval } from '../lib/revision.mjs';
import { z } from 'zod';
import Revision from '../models/Revision.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';
import { getEndOfToday } from '../utils/dateRange.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Validation Schemas ───────────────────────────────────────

export const createRevisionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  type: z.enum(['topic', 'note', 'problem']),
  linkedNote: z.string().optional().nullable(),
  linkedProblem: z.string().optional().nullable(),
  solution: z.string().trim().min(1).max(6000).optional(),
  dueDate: z.string().or(z.date()),
  intervalDays: z.number().min(1).default(1),
}).strict();

export const updateRevisionSchema = createRevisionSchema.partial().strict();

export const completeRevisionSchema = z.object({
  feedback: z.enum(['Easy', 'Correct but slow', 'Needed hint', 'Forgot', 'Remembered', 'Hard']),
}).strict();

// ─── Interval Calculation ─────────────────────────────────────


// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/revisions
 */
export const getRevisions = asyncHandler(async (req, res) => {
  const { status, type, search } = req.query;

  const query = { user: req.user.id };
  if (typeof status === 'string' && status) query.status = status;
  if (typeof type === 'string' && type) query.type = type;
  if (typeof search === 'string' && search.trim()) {
    query.title = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: 'i' };
  }

  const revisions = await Revision.find(query)
    .sort({ dueDate: 1 })
    .populate('linkedNote', 'title folder')
    .populate('linkedProblem', 'name platform difficulty')
    .lean();

  res.json(revisions);
});

/**
 * GET /api/revisions/due
 */
export const getDueRevisions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('timezone').lean();
  const endOfToday = getEndOfToday(user?.timezone);

  const due = await Revision.find({
    user: req.user.id,
    dueDate: { $lte: endOfToday },
    status: { $ne: 'completed' },
  })
    .sort({ dueDate: 1 })
    .populate('linkedNote', 'title folder')
    .populate('linkedProblem', 'name platform difficulty')
    .lean();

  res.json(due);
});

/**
 * GET /api/revisions/:id
 */
export const getRevision = asyncHandler(async (req, res) => {
  const revision = await Revision.findOne({
    _id: req.params.id,
    user: req.user.id,
  })
    .populate('linkedNote')
    .populate('linkedProblem')
    .lean();

  if (!revision) {
    throw ApiError.notFound('Revision item not found');
  }

  res.json(revision);
});

/**
 * POST /api/revisions
 */
export const createRevision = asyncHandler(async (req, res) => {
  const revision = await Revision.create({
    ...req.body,
    user: req.user.id,
  });
  emitToUser(req.user.id, 'revision:created', revision);

  res.status(201).json(revision);
});

/**
 * PUT /api/revisions/:id
 */
export const updateRevision = asyncHandler(async (req, res) => {
  const revision = await Revision.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  );

  if (!revision) {
    throw ApiError.notFound('Revision item not found');
  }
  emitToUser(req.user.id, 'revision:updated', revision);

  res.json(revision);
});

/**
 * DELETE /api/revisions/:id
 */
export const deleteRevision = asyncHandler(async (req, res) => {
  const revision = await Revision.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!revision) {
    throw ApiError.notFound('Revision item not found');
  }
  emitToUser(req.user.id, 'revision:deleted', { _id: req.params.id });

  res.json({ message: 'Revision deleted successfully' });
});

/**
 * POST /api/revisions/:id/complete
 */
export const completeRevision = asyncHandler(async (req, res) => {
  const { feedback } = req.body;
  const revision = await Revision.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!revision) {
    throw ApiError.notFound('Revision item not found');
  }

  const currentInterval = revision.intervalDays || 1;
  const nextInterval = calculateNextInterval(currentInterval, feedback);

  // Record history
  const historyEntry = {
    date: new Date(),
    feedback,
    nextInterval,
  };

  revision.history.push(historyEntry);
  revision.feedback = feedback;
  revision.completedAt = new Date();

  // Schedule next revision
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + nextInterval);

  revision.dueDate = nextDueDate;
  revision.intervalDays = nextInterval;
  revision.status = 'pending';

  await revision.save();
  emitToUser(req.user.id, 'revision:updated', revision);

  res.json(revision);
});

