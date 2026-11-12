import { z } from 'zod';
import Revision from '../models/Revision.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Validation Schemas ───────────────────────────────────────

export const createRevisionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  type: z.enum(['topic', 'note', 'problem']),
  linkedNote: z.string().optional().nullable(),
  linkedProblem: z.string().optional().nullable(),
  dueDate: z.string().or(z.date()),
  intervalDays: z.number().min(1).default(1),
}).strict();

export const updateRevisionSchema = createRevisionSchema.partial().strict();

export const completeRevisionSchema = z.object({
  feedback: z.enum(['Easy', 'Correct but slow', 'Needed hint', 'Forgot']),
}).strict();

// ─── Interval Calculation ─────────────────────────────────────

function calculateNextInterval(currentInterval = 1, feedback) {
  switch (feedback) {
    case 'Easy':
      // 1 -> 3 -> 7 -> 14 -> 30
      if (currentInterval <= 1) return 3;
      if (currentInterval <= 3) return 7;
      if (currentInterval <= 7) return 14;
      return currentInterval * 2;
    case 'Correct but slow':
      if (currentInterval <= 1) return 2;
      return Math.round(currentInterval * 1.5);
    case 'Needed hint':
      return currentInterval;
    case 'Forgot':
      return 1;
    default:
      return 3;
  }
}

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/revisions
 */
export const getRevisions = asyncHandler(async (req, res) => {
  const { status, type, search } = req.query;

  const query = { user: req.user.id };
  if (status) query.status = status;
  if (type) query.type = type;
  if (search) query.title = { $regex: escapeRegex(search.slice(0, 100)), $options: 'i' };

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
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const due = await Revision.find({
    user: req.user.id,
    dueDate: { $lte: endOfToday },
    status: { $ne: 'completed' },
  })
    .sort({ dueDate: 1 })
    .populate('linkedNote', 'title folder')
    .populate('linkedProblem', 'name platform difficulty');

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
    .populate('linkedProblem');

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
    { new: true, runValidators: true }
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

