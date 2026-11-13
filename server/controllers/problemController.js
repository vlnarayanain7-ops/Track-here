import mongoose from 'mongoose';
import { z } from 'zod';
import Problem from '../models/Problem.js';
import ProblemAttempt from '../models/ProblemAttempt.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Validation Schemas ───────────────────────────────────────

export const createProblemSchema = z.object({
  name: z.string().trim().optional(),
  title: z.string().trim().optional(),
  url: z.string().url().optional().or(z.literal('')).nullable(),
  platform: z.enum(['Codeforces', 'CodeChef', 'LeetCode', 'Other']).optional().nullable(),
  topic: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['Unsolved', 'Attempted', 'Solved', 'Review']).optional(),
  solvedIndependently: z.boolean().optional(),
  nextRevisionDate: z.string().or(z.date()).optional().nullable(),
}).passthrough().transform((val) => ({
  ...val,
  name: val.name || val.title || 'Untitled Problem',
  topic: val.topic || val.category || 'General',
  status: val.status === 'Review' ? 'Attempted' : (val.status || 'Solved'),
}));

export const updateProblemSchema = z.object({
  name: z.string().trim().optional(),
  title: z.string().trim().optional(),
  url: z.string().url().optional().or(z.literal('')).nullable(),
  platform: z.enum(['Codeforces', 'CodeChef', 'LeetCode', 'Other']).optional().nullable(),
  topic: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['Unsolved', 'Attempted', 'Solved', 'Review']).optional(),
  solvedIndependently: z.boolean().optional(),
  nextRevisionDate: z.string().or(z.date()).optional().nullable(),
}).passthrough();

export const createAttemptSchema = z.object({
  duration: z.number().min(0).optional(),
  outcome: z.enum([
    'Solved independently',
    'Solved with hints',
    'Solved after viewing solution',
    'Not solved',
  ]),
  approach: z.string().optional().nullable(),
  timeComplexity: z.string().optional().nullable(),
  spaceComplexity: z.string().optional().nullable(),
  mistakes: z.string().optional().nullable(),
  learning: z.string().optional().nullable(),
  attemptedAt: z.string().or(z.date()).optional(),
}).strict();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/problems
 */
export const getProblems = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    platform,
    difficulty,
    status,
    topic,
    search,
    sort = '-createdAt',
  } = req.query;

  const query = { user: req.user.id };

  if (typeof platform === 'string' && platform) query.platform = platform;
  if (typeof difficulty === 'string' && difficulty) query.difficulty = difficulty;
  if (typeof status === 'string' && status) query.status = status;
  if (typeof topic === 'string' && topic.trim()) {
    query.topic = { $regex: escapeRegex(topic.trim().slice(0, 100)), $options: 'i' };
  }
  if (typeof search === 'string' && search.trim()) {
    const safeSearch = escapeRegex(search.trim().slice(0, 100));
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { topic: { $regex: safeSearch, $options: 'i' } },
      { tags: { $in: [new RegExp(safeSearch, 'i')] } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;
  const safeSort = typeof sort === 'string' ? sort : '-createdAt';

  const [problems, total] = await Promise.all([
    Problem.find(query)
      .sort(safeSort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Problem.countDocuments(query),
  ]);

  res.json({
    problems,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/problems/:id
 */
export const getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  const attempts = await ProblemAttempt.find({
    problem: problem._id,
    user: req.user.id,
  }).sort({ attemptNumber: 1 });

  res.json({
    problem,
    attempts,
  });
});

/**
 * POST /api/problems
 */
export const createProblem = asyncHandler(async (req, res) => {
  const data = req.body;

  const problem = await Problem.create({
    ...data,
    user: req.user.id,
  });
  emitToUser(req.user.id, 'problem:created', problem);

  res.status(201).json(problem);
});

/**
 * PUT /api/problems/:id
 */
export const updateProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  emitToUser(req.user.id, 'problem:updated', problem);

  res.json(problem);
});

/**
 * DELETE /api/problems/:id
 */
export const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  // Delete all associated attempts
  await ProblemAttempt.deleteMany({
    problem: problem._id,
    user: req.user.id,
  });
  emitToUser(req.user.id, 'problem:deleted', { _id: req.params.id });

  res.json({ message: 'Problem deleted successfully' });
});

/**
 * POST /api/problems/:id/attempts
 */
export const addAttempt = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  // Count existing attempts to determine next attemptNumber
  const attemptCount = await ProblemAttempt.countDocuments({
    problem: problem._id,
    user: req.user.id,
  });

  const nextAttemptNumber = attemptCount + 1;
  const { outcome } = req.body;

  const attempt = await ProblemAttempt.create({
    ...req.body,
    attemptNumber: nextAttemptNumber,
    problem: problem._id,
    user: req.user.id,
  });

  // Update parent problem status based on outcome
  const isSolved = outcome.startsWith('Solved');
  const isIndependent = outcome === 'Solved independently';

  problem.status = isSolved ? 'Solved' : 'Attempted';
  if (isIndependent) {
    problem.solvedIndependently = true;
  }
  await problem.save();

  res.status(201).json({
    attempt,
    problem,
  });
});

/**
 * GET /api/problems/stats
 */
export const getProblemStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [totalProblems, solvedProblems, independentSolved, byDifficulty, byPlatform] = await Promise.all([
    Problem.countDocuments({ user: userId }),
    Problem.countDocuments({ user: userId, status: 'Solved' }),
    Problem.countDocuments({ user: userId, solvedIndependently: true }),
    Problem.aggregate([
      { $match: { user: userObjId } },
      { $group: { _id: '$difficulty', count: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$status', 'Solved'] }, 1, 0] } } } },
    ]),
    Problem.aggregate([
      { $match: { user: userObjId } },
      { $group: { _id: '$platform', count: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$status', 'Solved'] }, 1, 0] } } } },
    ]),
  ]);

  res.json({
    total: totalProblems,
    solved: solvedProblems,
    solvedIndependently: independentSolved,
    byDifficulty,
    byPlatform,
  });
});

